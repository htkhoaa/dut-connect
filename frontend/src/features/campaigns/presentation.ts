import type {BadgeTone} from '../../shared/components/Badge';
import type {CampaignStatus,ProposalStatus,ContributionMode,OrganizerType} from './types';
export const campaignStatuses:Record<CampaignStatus,{label:string;tone:BadgeTone}>={
    DRAFT:{label:'Bản nháp',tone:'neutral'},OPEN:{label:'Đang tuyển',tone:'success'},ACTIVE:{label:'Đang hoạt động',tone:'success'},COMPLETED:{label:'Đã hoàn thành',tone:'neutral'},CANCELLED:{label:'Đã hủy',tone:'danger'}
};
export const proposalStatuses:Record<ProposalStatus,{label:string;tone:BadgeTone}>={PENDING:{label:'Chờ duyệt',tone:'neutral'},APPROVED:{label:'Đã duyệt',tone:'success'},REJECTED:{label:'Đã từ chối',tone:'danger'}};
export const modes:Partial<Record<ContributionMode,string>>={VOLUNTEER_ONLY:'Tình nguyện'};
export const organizers:Record<OrganizerType,string>={INDIVIDUAL:'Cá nhân',ORGANIZATION:'Tổ chức'};
export function vnd(value:string|null|undefined) {return value==null?'Chưa xác định':new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(BigInt(value));}
export function dateTime(value:string|null) {return value?new Date(value).toLocaleString('vi-VN'):'Không có thời hạn';}
