import {useEffect, useRef} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../auth/store';
import * as api from './api';

function getWsUrl(): string {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
        const url = new URL(apiBase);
        const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${url.host}/ws/notifications`;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/notifications`;
}

export function useNotifications() {
    const {user} = useAuth();
    const qc = useQueryClient();
    const wsRef = useRef<WebSocket | null>(null);

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
        if (!user) {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            return;
        }

        let isUnmounted = false;
        let reconnectTimer: ReturnType<typeof setTimeout>;

        function connect() {
            try {
                const wsUrl = getWsUrl();
                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.action === 'NEW_NOTIFICATION') {
                            void qc.invalidateQueries({queryKey: ['notifications']});
                            // Optional gentle audio beep or vibration
                            if ('vibrate' in navigator) navigator.vibrate(100);
                        }
                    } catch (ignored) {}
                };

                ws.onclose = () => {
                    if (!isUnmounted) {
                        reconnectTimer = setTimeout(connect, 5000);
                    }
                };

                ws.onerror = () => {
                    ws.close();
                };
            } catch (err) {
                if (!isUnmounted) reconnectTimer = setTimeout(connect, 5000);
            }
        }

        connect();

        return () => {
            isUnmounted = true;
            clearTimeout(reconnectTimer);
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [user, qc]);

    return {
        unreadCount: unreadQuery.data?.count ?? 0,
        recentNotifications: recentQuery.data?.content ?? [],
        isLoading: recentQuery.isPending,
        markAsRead: markReadMutation.mutate,
        markAllAsRead: markAllReadMutation.mutate,
        isMarkingAll: markAllReadMutation.isPending,
    };
}
