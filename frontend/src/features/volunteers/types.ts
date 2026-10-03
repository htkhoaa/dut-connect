import type {SkillTrack} from '../campaigns/types';
export type ApplicationStatus='PENDING'|'ACCEPTED'|'REJECTED'|'CANCELLED';
export interface VolunteerApplication {
    id:string;campaignId:string;campaignTitle:string;campaignSlug:string;userId:string;fullName:string;studentId:string;
    preferredTrack:SkillTrack;assignedTrack:SkillTrack|null;motivation:string;availability:string|null;status:ApplicationStatus;
    rejectionReason:string|null;reviewedByUserId:string|null;reviewedAt:string|null;createdAt:string;updatedAt:string;version:number;
}
export interface ApplicationInput {preferredTrack:SkillTrack;motivation:string;availability:string}
export interface ApplicationFilters {page:number;status:ApplicationStatus|'';track:SkillTrack|''}
export interface RecruitmentSummary {accepted:number;technical:number;logistics:number;targetVolunteerCount:number|null;targetTechnicalCount:number|null;targetLogisticsCount:number|null;canReview:boolean}
export type ApplicationAction={id:string;command:'accept';assignedTrack:SkillTrack;version:number}|{id:string;command:'reject';reason:string;version:number}|{id:string;command:'cancel';version:number};
