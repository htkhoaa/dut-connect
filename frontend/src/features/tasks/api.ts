import {apiClient} from '../../shared/api/client';
import type {PageResponse} from '../../shared/api/errors';
import type {Task, TaskInput} from '../coordination/types';

export async function list(c: string, page: number, status: string) {
    return (await apiClient.get<PageResponse<Task>>('/campaigns/' + c + '/tasks', {
        params: {
            page,
            size: 20,
            status: status || undefined
        }
    })).data;
}

export async function save(c: string, id: string | undefined, body: TaskInput) {
    return (await (id ? apiClient.patch<Task>('/tasks/' + id, body) : apiClient.post<Task>('/campaigns/' + c + '/tasks', body))).data;
}

export async function remove(id: string, version: number) {
    await apiClient.delete('/tasks/' + id, {params: {version}});
}

export async function mine(page: number, status: string) {
    return (await apiClient.get<PageResponse<Task>>('/me/tasks', {
        params: {
            page,
            size: 20,
            status: status || undefined
        }
    })).data;
}

export async function detail(id: string) {
    return (await apiClient.get<Task>('/tasks/' + id)).data;
}

export async function transition(id: string, command: string, version: number) {
    return (await apiClient.post<Task>('/tasks/' + id + '/' + command, {version})).data;
}
