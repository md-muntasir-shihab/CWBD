import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getHomeStreamUrl } from '../services/api';

const FALLBACK_POLL_MS = 30000;

export default function useHomeLiveUpdates(): void {
    const queryClient = useQueryClient();
    const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        let source: EventSource | null = null;
        let disposed = false;

        const invalidate = () => {
            queryClient.invalidateQueries({ queryKey: ['home-system'] }).catch(() => undefined);
            queryClient.invalidateQueries({ queryKey: ['universities'] }).catch(() => undefined);
            queryClient.invalidateQueries({ queryKey: ['university-categories'] }).catch(() => undefined);
            queryClient.invalidateQueries({ queryKey: ['home-clusters-featured'] }).catch(() => undefined);
        };

        const startFallbackPoll = () => {
            if (fallbackTimerRef.current) return;
            fallbackTimerRef.current = setInterval(() => invalidate(), FALLBACK_POLL_MS);
        };

        const stopFallbackPoll = () => {
            if (!fallbackTimerRef.current) return;
            clearInterval(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
        };

        const clearReconnect = () => {
            if (!reconnectTimerRef.current) return;
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        };

        const connect = () => {
            if (disposed) return;
            if (source) {
                source.close();
                source = null;
            }
            source = new EventSource(getHomeStreamUrl(), { withCredentials: true });

            source.addEventListener('home-updated', invalidate);
            source.addEventListener('category-updated', invalidate);
            source.addEventListener('cluster-updated', invalidate);
            source.addEventListener('banner-updated', invalidate);
            source.addEventListener('news-updated', invalidate);
            source.addEventListener('ping', () => {
                stopFallbackPoll();
            });
            source.onopen = () => {
                stopFallbackPoll();
                clearReconnect();
            };

            source.onerror = () => {
                if (disposed) return;
                startFallbackPoll();
                if (!reconnectTimerRef.current) {
                    reconnectTimerRef.current = setTimeout(() => {
                        reconnectTimerRef.current = null;
                        connect();
                    }, 2000);
                }
            };
        };

        connect();

        return () => {
            disposed = true;
            if (source) source.close();
            stopFallbackPoll();
            clearReconnect();
        };
    }, [queryClient]);
}
