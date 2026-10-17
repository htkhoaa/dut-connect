import type {SkillTrack} from '../campaigns/types';
export {tracks} from '../volunteers/presentation';
export type Track = SkillTrack;
export type AttendanceStatus = 'PRESENT' | 'ABSENT';
export type MeetingType = 'ONLINE' | 'OFFLINE';



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







export const attendanceStatuses = {PRESENT: 'Có mặt', ABSENT: 'Vắng mặt'};
export const meetingTypes = {ONLINE: 'Trực tuyến', OFFLINE: 'Trực tiếp'};


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



export interface SessionInput {
    title: string;
    startsAt: string;
    endsAt: string;
    version?: number
}



export interface AttendanceRecordInput {
    userId: string;
    status: AttendanceStatus;
}

export interface AttendanceResult {
    session: Session;
    records: AttendanceRecord[];
}
