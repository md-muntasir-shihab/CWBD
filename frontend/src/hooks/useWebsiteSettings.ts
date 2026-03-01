import { useQuery } from '@tanstack/react-query';
import { getPublicSettings } from '../services/api';

export function useWebsiteSettings() {
    return useQuery({
        queryKey: ['website-settings'],
        queryFn: async () => {
            const { data } = await getPublicSettings();
            if (typeof data !== 'object' || data === null) return null;
            return data;
        },
        staleTime: 300000, // 5 minutes cache
    });
}
