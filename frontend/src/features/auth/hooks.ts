import {useMutation} from '@tanstack/react-query';
import {useEffect} from 'react';
import {login, register, logout} from './api';
import {refreshSession} from '../../shared/api/client';

let initialization: Promise<void> | undefined;

export function useInitializeAuth() {
    useEffect(() => {
        initialization ??= refreshSession().then(() => undefined).catch(() => undefined);
    }, []);
}

export function useLogin() {
    return useMutation({mutationFn: login});
}

export function useRegister() {
    return useMutation({mutationFn: register});
}

export function useLogout() {
    return useMutation({mutationFn: logout});
}
