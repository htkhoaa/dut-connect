import type {SkillTrack} from '../campaigns/types';
export {tracks} from '../volunteers/presentation';
export type Track = SkillTrack;
export type AttendanceStatus = 'PRESENT' | 'ABSENT';
export type MeetingType = 'ONLINE' | 'OFFLINE';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'VERIFIED';
export type CompletionStatus = 'PENDING' | 'COMPLETED' | 'VERIFIED';

export interface Resource {
    id: string;
    campaignId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    version: number;
    createdByUserId: string
}

export interface Meeting extends Resource {
    description: string | null;
    meetingType: MeetingType;
    startsAt: string;
    endsAt: string;
    location: string | null;
    meetingUrl: string | null;
    canManage: boolean
}

export interface Assignee {
    userId: string;
    fullName: string;
    studentId: string;
    assignedTrack: Track
}

export interface Task extends Resource {
    campaignTitle: string;
    description: string;
    track: Track;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueAt: string | null;
    status: TaskStatus;
    assignees: Assignee[];
    verifiedByUserId: string | null;
    verifiedAt: string | null;
    canManage: boolean;
    canProgress: boolean
}

export interface Session extends Resource {
    startsAt: string;
    endsAt: string
}

export interface AttendanceRecord {
    id: string;
    sessionId: string;
    userId: string;
    fullName: string;
    studentId: string;
    status: AttendanceStatus;
    recordedByUserId: string;
    recordedAt: string;
    updatedAt: string
}

export interface Completion {
    id: string | null;
    campaignId: string;
    userId: string;
    fullName: string;
    studentId: string;
    assignedTrack: Track;
    status: CompletionStatus;
    verifiedHours: string | null;
    note: string | null;
    verifiedByUserId: string | null;
    verifiedAt: string | null;
    version: number | null;
    presentSessions: number;
    totalSessions: number
}

export interface History {
    campaignId: string;
    campaignTitle: string;
    campaignSlug: string;
    assignedTrack: Track;
    completionStatus: CompletionStatus;
    verifiedHours: string | null;
    verifiedAt: string | null;
    note: string | null;
    presentSessions: number;
    totalSessions: number
}

export const taskStatuses = {TODO: 'Cần làm', IN_PROGRESS: 'Đang thực hiện', DONE: 'Đã làm xong', VERIFIED: 'Đã xác minh'};
export const completionStatuses = {PENDING: 'Chờ xử lý', COMPLETED: 'Đã hoàn thành', VERIFIED: 'Đã xác minh'};
export const attendanceStatuses = {PRESENT: 'Có mặt', ABSENT: 'Vắng mặt'};
export const meetingTypes = {ONLINE: 'Trực tuyến', OFFLINE: 'Trực tiếp'};
export const priorities = {LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao'};

export interface MeetingInput {
    title: string;
    description: string | null;
    meetingType: MeetingType;
    startsAt: string;
    endsAt: string;
    location: string | null;
    meetingUrl: string | null;
    clearFields?: string[];
    version?: number
}

export interface TaskInput {
    title?: string;
    description?: string;
    track?: Track;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    dueAt?: string | null;
    assigneeUserIds?: string[];
    status?: TaskStatus;
    clearFields?: string[];
    version?: number
}

export interface SessionInput {
    title: string;
    startsAt: string;
    endsAt: string;
    version?: number
}

export interface CompletionInput {
    status: CompletionStatus;
    verifiedHours: string | null;
    note: string;
    version: number | null
}

export interface AttendanceRecordInput {
    userId: string;
    status: AttendanceStatus;
}

export interface AttendanceResult {
    session: Session;
    records: AttendanceRecord[];
}
