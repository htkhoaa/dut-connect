import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../auth/store';
import * as api from './api';
import {validId} from './types';

export function useDonationSettings() {
    return useQuery({queryKey: ['donation-settings'], queryFn: api.settings});
}

export function useDonationQuery<T>(key: readonly unknown[], query: () => Promise<T>, enabled = true) {
    const {user, initialized} = useAuth();
    return useQuery({
        queryKey: ['donations', user?.id, ...key],
        queryFn: query,
        enabled: initialized && !!user && enabled
    });
}

export function useDonation(id: string) {
    return useDonationQuery(['detail', id], () => api.detail(id), validId(id));
}

export function useDonationMutation<T, R>(fn: (input: T) => Promise<R>) {
    const client = useQueryClient();
    return useMutation({
        mutationFn: fn, onSuccess: async () => {
            await Promise.all(['donations','finance','campaigns','dashboard'].map(key=>client.invalidateQueries({queryKey:[key]})));
        }
    });
}
