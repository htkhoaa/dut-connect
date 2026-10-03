import type {BadgeTone} from '../../shared/components/Badge';
import type {OrganizationStatus, MemberRole} from './types';
export const organizationStatuses: Record<OrganizationStatus, {label: string; tone: BadgeTone}> = {
    PENDING_VERIFICATION: {label: 'Chờ xác minh', tone: 'neutral'},
    VERIFIED: {label: 'Đã xác minh', tone: 'success'}, SUSPENDED: {label: 'Tạm ngừng', tone: 'danger'},
};
export const memberRoles: Record<MemberRole, string> = {OWNER: 'Chủ sở hữu', MANAGER: 'Người quản lý', MEMBER: 'Thành viên'};
