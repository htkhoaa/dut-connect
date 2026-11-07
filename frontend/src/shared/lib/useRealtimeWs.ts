import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../features/auth/store';

export function getWsUrl(): string {
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
        const url = new URL(apiBase);
        const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${url.host}/ws/notifications`;
    }
    // On Vercel or cloud domain, direct WebSocket connections directly to Render backend
    if (typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('dutconnect'))) {
        return 'wss://dut-connect.onrender.com/ws/notifications';
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/notifications`;
}

export function useGlobalRealtime() {
    const { user, accessToken } = useAuth();
    const qc = useQueryClient();
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        let isUnmounted = false;
        let reconnectTimer: ReturnType<typeof setTimeout>;
        let pingInterval: ReturnType<typeof setInterval>;

        function connect() {
            try {
                const token = useAuth.getState().accessToken;
                const wsBase = getWsUrl();
                const wsUrl = token ? `${wsBase}?token=${encodeURIComponent(token)}` : wsBase;
                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;

                ws.onopen = () => {
                    pingInterval = setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            try { ws.send('ping'); } catch {}
                        }
                    }, 25000);
                };

                ws.onmessage = (event) => {
                    try {
                        if (event.data === 'pong') return;
                        const data = JSON.parse(event.data);

                        window.dispatchEvent(new CustomEvent('app:ws_message', { detail: data }));

                        if (data.action === 'DONATION_RECEIVED' || data.action === 'DONATION_SUCCESS') {
                            window.dispatchEvent(new CustomEvent('app:donation_received', { detail: data }));
                            void qc.invalidateQueries({ queryKey: ['finance'] });
                            void qc.refetchQueries({ queryKey: ['finance'] });
                            void qc.invalidateQueries({ queryKey: ['campaigns'] });
                            void qc.refetchQueries({ queryKey: ['campaigns'] });
                            void qc.invalidateQueries({ queryKey: ['campaign'] });
                            void qc.invalidateQueries({ queryKey: ['financial-summary'] });
                            void qc.invalidateQueries({ queryKey: ['campaign-dashboard'] });
                            void qc.invalidateQueries({ queryKey: ['dashboard'] });
                            void qc.invalidateQueries({ queryKey: ['activities'] });
                            void qc.invalidateQueries({ queryKey: ['notifications'] });
                            void qc.invalidateQueries({ queryKey: ['donations'] });
                            void qc.invalidateQueries({ queryKey: ['me', 'donations'] });
                        } else if (data.action === 'NEW_NOTIFICATION') {
                            window.dispatchEvent(new CustomEvent('app:new_notification', { detail: data }));
                            void qc.invalidateQueries({ queryKey: ['notifications'] });
                            if ('vibrate' in navigator) navigator.vibrate(100);
                        } else if (data.action === 'CAMPAIGN_UPDATED') {
                            void qc.invalidateQueries({ queryKey: ['campaign'] });
                            void qc.invalidateQueries({ queryKey: ['campaigns'] });
                            void qc.invalidateQueries({ queryKey: ['financial-summary'] });
                            void qc.invalidateQueries({ queryKey: ['campaign-dashboard'] });
                        }
                    } catch (ignored) {}
                };

                ws.onclose = () => {
                    clearInterval(pingInterval);
                    if (!isUnmounted) {
                        reconnectTimer = setTimeout(connect, 4000);
                    }
                };

                ws.onerror = () => {
                    ws.close();
                };
            } catch (err) {
                if (!isUnmounted) reconnectTimer = setTimeout(connect, 4000);
            }
        }

        connect();

        return () => {
            isUnmounted = true;
            clearTimeout(reconnectTimer);
            clearInterval(pingInterval);
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [user, accessToken, qc]);
}
