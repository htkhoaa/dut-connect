export type OrganizationStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'SUSPENDED';
export type MemberRole = 'OWNER' | 'MANAGER' | 'MEMBER';
export interface OrganizationType {id: string; code: string; name: string; active: boolean}
export interface OrganizationSummary {
    id: string; name: string; slug: string; organizationTypeId: string; organizationTypeName: string;
    status: OrganizationStatus; version: number; createdAt: string;
    description?: string | null;
}
export interface OrganizationDetail {
    organization: OrganizationSummary; description: string | null; createdByUserId: string;
    verifiedByUserId: string | null; verifiedAt: string | null; updatedAt: string;
    ownRole: MemberRole | null; canEdit: boolean; canManageMembers: boolean; canRepresent: boolean;
}
export interface OrganizationMember {userId: string; studentId: string; fullName: string; memberRole: MemberRole; joinedAt: string}
export interface OrganizationValues {name: string; organizationTypeId: string; description: string}
export interface OrganizationPatch extends OrganizationValues {version: number; clearDescription?: boolean}
export interface AddMemberRequest {studentId: string; memberRole: 'MANAGER' | 'MEMBER'; version: number}
export interface MemberChangeRequest {userId: string; memberRole: 'MANAGER' | 'MEMBER'; version: number}
export interface MemberVersionRequest {userId: string; version: number}
export type Moderation = 'verify' | 'suspend' | 'restore';
export type OrganizationScope = 'public' | 'mine' | 'admin';
