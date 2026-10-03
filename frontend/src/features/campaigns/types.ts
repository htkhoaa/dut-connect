import type {PageResponse} from '../../shared/api/errors';
export type OrganizerType = 'INDIVIDUAL' | 'ORGANIZATION';
export type ContributionMode = 'VOLUNTEER_ONLY' | 'DONATION_ONLY' | 'HYBRID';
export type CampaignStatus = 'DRAFT' | 'OPEN' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type ProposalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ManagerRole = 'OWNER' | 'MANAGER';
export type SkillTrack = 'TECHNICAL' | 'LOGISTICS';
export interface Content {
    organizerType: OrganizerType;
    organizationId: string | null;
    categoryId: string;
    title: string;
    summary: string;
    description: string;
    expectedImpact: string | null;
    contributionMode: ContributionMode;
    startDate: string;
    endDate: string;
    applicationDeadline: string | null;
    fundraisingDeadline: string | null;
    targetVolunteerCount: number | null;
    targetTechnicalCount: number | null;
    targetLogisticsCount: number | null;
    volunteerRequirements: string | null;
    fundraisingGoal: string | null;
    institutionalFunding: string;
    sponsorName: string | null;
    sponsorFunding: string;
    estimatedBudget: string | null;
}
export type FormValues = {[K in keyof Content]: string};
export interface Category {id:string;name:string;slug:string;description:string|null;active:boolean;version:number}
export interface CampaignSummary {id:string;slug:string;title:string;summary:string;organizerName:string;categoryName:string;categoryId:string;organizationId:string|null;contributionMode:ContributionMode;status:CampaignStatus;startDate:string;endDate:string;targetVolunteerCount:number|null;fundraisingGoal:string|null;createdAt:string;version:number}
export interface CampaignDetail {id:string;slug:string;proposalId:string;primaryContactUserId:string;primaryContactName:string;organizerName:string;categoryName:string;content:Content;status:CampaignStatus;createdAt:string;updatedAt:string;version:number;ownRole:ManagerRole|null;canManage:boolean;canAssignManagers:boolean;skills:SkillRequirement[]}
export interface ProposalSummary {id:string;title:string;organizerType:OrganizerType;status:ProposalStatus;version:number;createdAt:string}
export interface ProposalDetail {id:string;proposerUserId:string;proposerName:string;content:Content;categoryName:string;organizationName:string|null;status:ProposalStatus;rejectionReason:string|null;reviewedByUserId:string|null;reviewedAt:string|null;createdAt:string;updatedAt:string;version:number;campaignId:string|null;canEdit:boolean}
export interface Manager {userId:string;studentId:string;fullName:string;managerRole:ManagerRole;createdAt:string}
export interface SkillRequirement {skillId:string;name:string;track:SkillTrack;importance:number}
export interface SkillInput {skillId:string;track:SkillTrack;importance:number}
export interface OrganizationOption {id:string;name:string;status:string}
export interface SkillOption {id:string;name:string}
export interface CampaignFilters {page:number;q:string;status:CampaignStatus|'';categoryId:string;organizationId:string;contributionMode:ContributionMode|'';sort:'newest'|'startDate'}
export interface PlanWrite {content:Content;version?:number}
export type CampaignAction = {command:'open'|'start'|'complete'|'cancel';version:number};
export type TeamAction = {command:'add';studentId:string;version:number}|{command:'remove';userId:string;version:number};
export type ReviewAction = {command:'approve';version:number}|{command:'reject';reason:string;version:number};
export type CategoryWrite = {name:string;description:string;active:boolean;version?:number;clearDescription?:boolean};
export type CatalogPage<T> = PageResponse<T>;
