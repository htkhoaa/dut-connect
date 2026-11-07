import {useEffect} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../auth/store';
import * as api from './api';

export function useNotifications() {
    const {user} = useAuth();
    const qc = useQueryClient();

    const unreadQuery = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: api.getUnreadCount,
        enabled: !!user,
        refetchInterval: 15_000, // Fallback polling every 15s
    });

    const recentQuery = useQuery({
        queryKey: ['notifications', 'recent'],
        queryFn: () => api.getNotifications(0, 5),
        enabled: !!user,
        refetchInterval: 20_000,
    });

    const markReadMutation = useMutation({
        mutationFn: api.markAsRead,
        onSuccess: () => {
            void qc.invalidateQueries({queryKey: ['notifications']});
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: api.markAllAsRead,
        onSuccess: () => {
            void qc.invalidateQueries({queryKey: ['notifications']});
        },
    });

    useEffect(() => {
        const handler = () => {
            void qc.invalidateQueries({queryKey: ['notifications']});
        };
        window.addEventListener('app:new_notification', handler);
        window.addEventListener('app:donation_received', handler);
        return () => {
            window.removeEventListener('app:new_notification', handler);
            window.removeEventListener('app:donation_received', handler);
        };
    }, [qc]);

    return {
        unreadCount: unreadQuery.data?.count ?? 0,
        recentNotifications: recentQuery.data?.content ?? [],
        isLoading: recentQuery.isPending,
        markAsRead: markReadMutation.mutate,
        markAllAsRead: markAllReadMutation.mutate,
        isMarkingAll: markAllReadMutation.isPending,
    };
}
