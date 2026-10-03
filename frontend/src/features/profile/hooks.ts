import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {getProfile, getSkills, updateProfile, updateSkills} from './api';
import {useAuth} from '../auth/store';

export function useProfile() {
    return useQuery({queryKey: ['profile'], queryFn: getProfile});
}

export function useSkills() {
    return useQuery({queryKey: ['skills'], queryFn: getSkills});
}

export function useUpdateProfile() {
    const client = useQueryClient();
    return useMutation({
        mutationFn: updateProfile, onSuccess: (profile) => {
            client.setQueryData(['profile'], profile);
            useAuth.getState().updateUser(profile.user);
        }
    });
}

export function useUpdateSkills() {
    const client = useQueryClient();
    return useMutation({
        mutationFn: updateSkills, onSuccess: (profile) => {
            client.setQueryData(['profile'], profile);
        }
    });
}
