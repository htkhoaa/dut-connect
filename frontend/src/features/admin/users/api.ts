import {apiClient} from '../../../shared/api/client';
import type {PageResponse} from '../../../shared/api/errors';
import type {UserSummary} from '../../auth/types';
import type {ChangeStatusRequest} from './types';

export async function getUsers(page: number) {
    return (await apiClient.get<PageResponse<UserSummary>>('/admin/users', {params: {page, size: 20}})).data;
}

export async function changeStatus(input: ChangeStatusRequest) {
    return (await apiClient.patch<UserSummary>('/admin/users/' + input.id + '/status', {
        status: input.status,
        version: input.version
    })).data;
}
