import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {getUsers, changeStatus} from './api';
import {useAuth} from '../../auth/store';
import {clearSession} from '../../../shared/api/client';

export function useUsers(page: number) {
    return useQuery({queryKey: ['admin-users', page], queryFn: () => getUsers(page)});
}

export function useChangeStatus() {
    const client = useQueryClient();
    return useMutation({
        mutationFn: changeStatus, onSuccess: (user) => {
            if (user.id === useAuth.getState().user?.id && user.status === 'SUSPENDED') clearSession();
            else void client.invalidateQueries({queryKey: ['admin-users']});
        }
    });
}
