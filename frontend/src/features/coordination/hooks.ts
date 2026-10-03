import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../auth/store';

export function useCoordinationQuery<T>(key: readonly unknown[], query: () => Promise<T>, enabled = true) {
    const {user, initialized} = useAuth();
    return useQuery({
        queryKey: ['coordination', user?.id, ...key],
        queryFn: query,
        enabled: initialized && !!user && enabled
    });
}

export function useCoordinationMutation<T, R>(fn: (input: T) => Promise<R>) {
    const client = useQueryClient();
    return useMutation({
        mutationFn: fn, onSuccess: async () => {
            await Promise.all(['coordination', 'dashboard'].map(key => client.invalidateQueries({queryKey: [key]})));
        }
    });
}
