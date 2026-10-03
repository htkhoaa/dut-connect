import {useCampaignDashboard} from './hooks';
import {MetricGrid} from './MetricGrid';
import {vnd} from '../campaigns/presentation';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';
export function CampaignDashboard({campaignId}:{campaignId:string}){
    const query=useCampaignDashboard(campaignId);
    return <Card><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Tổng quan chiến dịch</h2><Button disabled={query.isFetching} onClick={()=>void query.refetch()}>Làm mới tổng quan</Button></div>
        {query.isPending?<LoadingState/>:query.isError?<ErrorState message={errorMessage(query.error)} onRetry={()=>void query.refetch()}/>:<>
            <MetricGrid items={[
                ['Tổng đăng ký',query.data.operations.applications.TOTAL],['Đăng ký chờ duyệt',query.data.operations.applications.PENDING],
                ['Tình nguyện viên đã duyệt',query.data.operations.applications.ACCEPTED],['Đăng ký đã từ chối',query.data.operations.applications.REJECTED],['Đăng ký đã hủy',query.data.operations.applications.CANCELLED],
                ['Đã phân công kỹ thuật',query.data.operations.assignedTracks.TECHNICAL],['Đã phân công hậu cần',query.data.operations.assignedTracks.LOGISTICS],
                ['Nhiệm vụ cần làm',query.data.operations.tasks.TODO],['Nhiệm vụ đang thực hiện',query.data.operations.tasks.IN_PROGRESS],['Nhiệm vụ đã làm xong',query.data.operations.tasks.DONE],['Nhiệm vụ đã xác minh',query.data.operations.tasks.VERIFIED],
                ['Buổi điểm danh',query.data.operations.attendanceSessionCount],['Hoàn thành đã xác minh',query.data.operations.verifiedCompletionCount],['Số giờ đã xác minh',query.data.operations.verifiedVolunteerHours],['Chi phí chờ duyệt',query.data.operations.pendingExpenseCount],
                ['Kinh phí nhà trường',vnd(query.data.financialSummary.institutionalFunding)],['Kinh phí tài trợ',vnd(query.data.financialSummary.sponsorFunding)],['Đóng góp đã xác nhận',vnd(query.data.financialSummary.verifiedDonations)],
                ['Tổng kinh phí',vnd(query.data.financialSummary.totalFunding)],['Chi phí đã duyệt',vnd(query.data.financialSummary.approvedExpenses)],['Kinh phí còn lại',vnd(query.data.financialSummary.remainingFunds)],['Lượt đóng góp thành công',query.data.financialSummary.successfulDonationCount],
                ['Mục tiêu gây quỹ',query.data.financialSummary.fundraisingGoal===null?'Chưa thiết lập':vnd(query.data.financialSummary.fundraisingGoal)]
            ]}/><p className="mt-5 text-sm text-text-secondary">Các tổng chỉ tính giờ hoàn thành đã xác minh, khoản đóng góp đã thanh toán và chi phí đã duyệt.</p>
        </>}
    </Card>;
}
