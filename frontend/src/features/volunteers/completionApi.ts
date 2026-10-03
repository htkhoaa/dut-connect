import {apiClient} from '../../shared/api/client';
import type {PageResponse} from '../../shared/api/errors';
import type {Completion, History, CompletionInput} from '../coordination/types';

export async function completions(c: string, page: number) {
    return (await apiClient.get<PageResponse<Completion>>('/campaigns/' + c + '/completions', {
        params: {
            page,
            size: 20
        }
    })).data;
}

export async function saveCompletion(c: string, user: string, body: CompletionInput) {
    return (await apiClient.put<Completion>('/campaigns/' + c + '/volunteers/' + user + '/completion', body)).data;
}

export async function history(page: number) {
    return (await apiClient.get<PageResponse<History>>('/me/volunteer-history', {params: {page, size: 20}})).data;
}
