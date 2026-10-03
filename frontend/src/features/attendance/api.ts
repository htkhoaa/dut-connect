import {apiClient} from '../../shared/api/client';
import type {PageResponse} from '../../shared/api/errors';
import type {Session, AttendanceRecord, SessionInput, AttendanceRecordInput, AttendanceResult} from '../coordination/types';

export async function list(c: string, page: number) {
    return (await apiClient.get<PageResponse<Session>>('/campaigns/' + c + '/attendance-sessions', {
        params: {
            page,
            size: 20
        }
    })).data;
}

export async function save(c: string, id: string | undefined, body: SessionInput) {
    return (await (id ? apiClient.patch<Session>('/attendance-sessions/' + id, body) : apiClient.post<Session>('/campaigns/' + c + '/attendance-sessions', body))).data;
}

export async function remove(id: string, version: number) {
    await apiClient.delete('/attendance-sessions/' + id, {params: {version}});
}

export async function records(id: string, page: number) {
    return (await apiClient.get<PageResponse<AttendanceRecord>>('/attendance-sessions/' + id + '/records', {
        params: {
            page,
            size: 20
        }
    })).data;
}

export async function record(id: string, version: number, records: AttendanceRecordInput[]) {
    return (await apiClient.put<AttendanceResult>('/attendance-sessions/' + id + '/records', {version, records})).data;
}
