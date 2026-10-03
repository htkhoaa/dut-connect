import axios, {AxiosHeaders} from 'axios';
import type {AuthResponse, LoginValues} from '../../features/auth/types';
import {useAuth} from '../../features/auth/store';
import {queryClient} from './queryClient';

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    timeout: 10_000,
    withCredentials: true,
});

let refreshRequest: Promise<AuthResponse> | undefined;
let sessionGeneration = 0;
let changingSession = false;

export function clearSession() {
    sessionGeneration++;
    useAuth.getState().clear();
    queryClient.clear();
}

function beginSessionChange() {
    if (changingSession) throw new Error('A session change is already in progress');
    changingSession = true;
    sessionGeneration++;
}

export async function loginSession(values: LoginValues) {
    beginSessionChange();
    try {
        // Cookie responses must finish in order, including a failed rotation.
        if (refreshRequest) await refreshRequest.catch(() => undefined);
        const {data} = await apiClient.post<AuthResponse>('/auth/login', values);
        queryClient.clear();
        useAuth.getState().accept(data);
        return data;
    } finally {
        changingSession = false;
    }
}

export async function logoutSession() {
    beginSessionChange();
    try {
        if (refreshRequest) {
            const session = await refreshRequest.catch(() => undefined);
            if (session) useAuth.getState().accept(session);
        }
        try {
            await apiClient.post('/auth/logout');
        } catch (error: unknown) {
            if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error;
            // Logout is protected: rotate an expired access token once, while
            // other requests remain unable to refresh or change accounts.
            await rotateSession();
            await apiClient.post('/auth/logout');
        }
        clearSession();
    } finally {
        changingSession = false;
    }
}

export function refreshSession(): Promise<AuthResponse> {
    if (changingSession) return Promise.reject(new Error('A session change is in progress'));
    return rotateSession();
}

function rotateSession(): Promise<AuthResponse> {
    if (!refreshRequest) {
        const generation = sessionGeneration;
        refreshRequest = apiClient.post<AuthResponse>('/auth/refresh')
            .then((response) => {
                if (generation === sessionGeneration) useAuth.getState().accept(response.data);
                return response.data;
            })
            .catch((error: unknown) => {
                if (generation === sessionGeneration) clearSession();
                throw error;
            })
            .finally(() => {
                refreshRequest = undefined;
            });
    }
    return refreshRequest;
}

apiClient.interceptors.request.use((config) => {
    const sessionConfig = config as typeof config & {sessionGeneration?: number};
    sessionConfig.sessionGeneration ??= sessionGeneration;
    const token = useAuth.getState().accessToken;
    if (token && !['/auth/login', '/auth/register', '/auth/refresh'].includes(config.url || '')) {
        config.headers.set('Authorization', 'Bearer ' + token);
    }
    return config;
}, undefined, {synchronous: true});
apiClient.interceptors.response.use((response) => response, async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error;
    const config = error.config as (NonNullable<typeof error.config> & {
        authRetried?: boolean;
        sessionGeneration?: number;
    }) | undefined;
    if (!config || error.response?.status !== 401 ||
        ['/auth/login', '/auth/register', '/auth/refresh'].includes(config.url || '')) throw error;
    // Never retry an old account's request using a new account's credentials.
    if (changingSession || config.sessionGeneration !== sessionGeneration) throw error;
    if (config.authRetried) {
        clearSession();
        throw error;
    }
    const session = await refreshSession();
    if (changingSession || config.sessionGeneration !== sessionGeneration) throw error;
    config.headers = AxiosHeaders.from(config.headers);
    config.headers.set('Authorization', 'Bearer ' + session.accessToken);
    config.authRetried = true;
    return apiClient.request(config);
});
