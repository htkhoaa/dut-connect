import {apiClient, loginSession, logoutSession} from '../../shared/api/client';
import type {LoginValues, RegisterValues, UserSummary} from './types';

export async function login(values: LoginValues) {
    return loginSession(values);
}

export async function register(values: RegisterValues) {
    return (await apiClient.post<UserSummary>('/auth/register', values)).data;
}

export async function logout() {
    await logoutSession();
}

export async function currentUser() {
    return (await apiClient.get<UserSummary>('/auth/me')).data;
}
