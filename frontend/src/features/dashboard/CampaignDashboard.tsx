import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useCampaignDashboard} from './hooks';
import {MetricGrid} from './MetricGrid';
import {vnd} from '../campaigns/presentation';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';
export function CampaignDashboard({campaignId}:{campaignId:string}){
    useLanguage();
    const query=useCampaignDashboard(campaignId);
    return <Card><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{tr("Tổng quan chiến dịch")}</h2><Button disabled={query.isFetching} onClick={()=>void query.refetch()}>{tr("Làm mới tổng quan")}</Button></div>
        {renderText(query.isPending?<LoadingState/>:query.isError?<ErrorState message={errorMessage(query.error)} onRetry={()=>void query.refetch()}/>:<>
            <MetricGrid items={[
                [tr("Tổng đăng ký"),query.data.operations.applications.TOTAL],[tr("Đăng ký chờ duyệt"),query.data.operations.applications.PENDING],
                [tr("Tình nguyện viên đã duyệt"),query.data.operations.applications.ACCEPTED],[tr("Đăng ký đã từ chối"),query.data.operations.applications.REJECTED],[tr("Đăng ký đã hủy"),query.data.operations.applications.CANCELLED],
                [tr("Đã phân công kỹ thuật"),query.data.operations.assignedTracks.TECHNICAL],[tr("Đã phân công hậu cần"),query.data.operations.assignedTracks.LOGISTICS],
                [tr("Nhiệm vụ cần làm"),query.data.operations.tasks.TODO],[tr("Nhiệm vụ đang thực hiện"),query.data.operations.tasks.IN_PROGRESS],[tr("Nhiệm vụ đã làm xong"),query.data.operations.tasks.DONE],[tr("Nhiệm vụ đã xác minh"),query.data.operations.tasks.VERIFIED],
                [tr("Buổi điểm danh"),query.data.operations.attendanceSessionCount],[tr("Hoàn thành đã xác minh"),query.data.operations.verifiedCompletionCount],[tr("Số giờ đã xác minh"),query.data.operations.verifiedVolunteerHours],[tr("Chi phí chờ duyệt"),query.data.operations.pendingExpenseCount],
                [tr("Kinh phí nhà trường"),vnd(query.data.financialSummary.institutionalFunding)],[tr("Kinh phí tài trợ"),vnd(query.data.financialSummary.sponsorFunding)],[tr("Đóng góp đã xác nhận"),vnd(query.data.financialSummary.verifiedDonations)],
                [tr("Tổng kinh phí"),vnd(query.data.financialSummary.totalFunding)],[tr("Chi phí đã duyệt"),vnd(query.data.financialSummary.approvedExpenses)],[tr("Kinh phí còn lại"),vnd(query.data.financialSummary.remainingFunds)],[tr("Lượt đóng góp thành công"),query.data.financialSummary.successfulDonationCount],
                [tr("Mục tiêu gây quỹ"),query.data.financialSummary.fundraisingGoal===null?tr("Chưa thiết lập"):vnd(query.data.financialSummary.fundraisingGoal)]
            ]}/><p className="mt-5 text-sm text-text-secondary">{tr("Các tổng chỉ tính giờ hoàn thành đã xác minh, khoản đóng góp đã thanh toán và chi phí đã duyệt.")}</p>
        </>)}
    </Card>;
}
