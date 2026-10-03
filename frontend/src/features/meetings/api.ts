import {apiClient} from '../../shared/api/client';
import type {PageResponse} from '../../shared/api/errors';
import type {Meeting, MeetingInput} from '../coordination/types';

export async function list(c: string, page: number) {
    return (await apiClient.get<PageResponse<Meeting>>('/campaigns/' + c + '/meetings', {
        params: {
            page,
            size: 20
        }
    })).data;
}

export async function save(c: string, id: string | undefined, body: MeetingInput) {
    return (await (id ? apiClient.patch<Meeting>('/meetings/' + id, body) : apiClient.post<Meeting>('/campaigns/' + c + '/meetings', body))).data;
}

export async function remove(id: string, version: number) {
    await apiClient.delete('/meetings/' + id, {params: {version}});
}
