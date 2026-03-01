import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getHomeStreamUrl } from '../services/api';

const FALLBACK_POLL_MS = 30000;

export default function useHomeLiveUpdates(): void {
    const queryClient = useQueryClient();
    const fallbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        let source: EventSource | null = null;
        let closedManually = false;

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

        const connect = () => {
            source = new EventSource(getHomeStreamUrl(), { withCredentials: true });

            source.addEventListener('home-updated', invalidate);
            source.addEventListener('category-updated', invalidate);
            source.addEventListener('cluster-updated', invalidate);
            source.addEventListener('banner-updated', invalidate);
            source.addEventListener('news-updated', invalidate);
            source.addEventListener('ping', () => {
                stopFallbackPoll();
            });

            source.onerror = () => {
                startFallbackPoll();
            };
        };

        connect();

        return () => {
            closedManually = true;
            if (source && !closedManually) {
                source.close();
            }
            if (source) source.close();
            stopFallbackPoll();
        };
    }, [queryClient]);
}

