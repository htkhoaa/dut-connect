import {useLanguage,tr,renderText} from '../../shared/lib/i18n';
import {MetricGrid} from './MetricGrid';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';
import {useCampaignDashboard} from './hooks';
export function CampaignDashboard({campaignId}:{campaignId:string}){
 useLanguage();const query=useCampaignDashboard(campaignId);
 return <Card><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{tr('Tổng quan chiến dịch')}</h2><Button variant="secondary" disabled={query.isFetching} onClick={()=>void query.refetch()}>{tr('Làm mới tổng quan')}</Button></div>
 {query.isPending?<LoadingState/>:query.isError?<ErrorState message={errorMessage(query.error)} onRetry={()=>void query.refetch()}/>:<MetricGrid items={[
 [tr('Tổng đăng ký'),query.data.operations.applications.TOTAL],[tr('Đăng ký chờ duyệt'),query.data.operations.applications.PENDING],
 [tr('Tình nguyện viên đã duyệt'),query.data.operations.applications.ACCEPTED],[tr('Đăng ký đã từ chối'),query.data.operations.applications.REJECTED],[tr('Đăng ký đã hủy'),query.data.operations.applications.CANCELLED],
 [tr('Đã phân công kỹ thuật'),query.data.operations.assignedTracks.TECHNICAL],[tr('Đã phân công hậu cần'),query.data.operations.assignedTracks.LOGISTICS],
 [tr('Buổi điểm danh'),query.data.operations.attendanceSessionCount],[tr('Lượt có mặt'),query.data.operations.presentAttendanceCount],[tr('Lịch họp'),query.data.operations.meetingCount]]}/>}
 <p className="mt-4 text-sm text-text-secondary">{renderText(tr('Số liệu tổng hợp từ đăng ký, lịch họp và điểm danh của chiến dịch.'))}</p></Card>;
}
