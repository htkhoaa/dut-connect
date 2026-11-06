import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useState} from 'react';
import {useCampaignDashboard} from './hooks';
import {MetricGrid} from './MetricGrid';
import {vnd} from '../campaigns/presentation';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';
import {CampaignFinalResult} from './CampaignFinalResult';

export function CampaignDashboard({campaignId, title, completed=false}:{campaignId:string; title?:string; completed?:boolean}){
    useLanguage();
    const query=useCampaignDashboard(campaignId);
    const [showPoster, setShowPoster] = useState(completed);
    return <Card>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">{tr("Tổng quan chiến dịch")}</h2>
            <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => setShowPoster(!showPoster)}>
                    🖼️ {renderText(showPoster ? tr("Ẩn poster kết quả") : tr("Tạo poster kết quả"))}
                </Button>
                <Button disabled={query.isFetching} onClick={()=>void query.refetch()}>{tr("Làm mới tổng quan")}</Button>
            </div>
        </div>
        {renderText(query.isPending?<LoadingState/>:query.isError?<ErrorState message={errorMessage(query.error)} onRetry={()=>void query.refetch()}/>:<>
            <MetricGrid items={[
                [tr("Tổng đăng ký"),query.data.operations.applications.TOTAL],[tr("Đăng ký chờ duyệt"),query.data.operations.applications.PENDING],
                [tr("Tình nguyện viên đã duyệt"),query.data.operations.applications.ACCEPTED],[tr("Đăng ký đã từ chối"),query.data.operations.applications.REJECTED],[tr("Đăng ký đã hủy"),query.data.operations.applications.CANCELLED],
                [tr("Đã phân công kỹ thuật"),query.data.operations.assignedTracks.TECHNICAL],[tr("Đã phân công hậu cần"),query.data.operations.assignedTracks.LOGISTICS],
                [tr("Nhiệm vụ cần làm"),query.data.operations.tasks.TODO],[tr("Nhiệm vụ đang thực hiện"),query.data.operations.tasks.IN_PROGRESS],[tr("Nhiệm vụ đã làm xong"),query.data.operations.tasks.DONE],[tr("Nhiệm vụ đã xác minh"),query.data.operations.tasks.VERIFIED],
                [tr("Buổi điểm danh"),query.data.operations.attendanceSessionCount],[tr("Hoàn thành đã xác minh"),query.data.operations.verifiedCompletionCount],[tr("Số giờ đã xác minh"),query.data.operations.verifiedVolunteerHours],
                [tr("Đã quyên góp"),vnd(query.data.financialSummary.verifiedDonations)],
                [tr("Mục tiêu gây quỹ"),query.data.financialSummary.fundraisingGoal===null?tr("Chưa thiết lập"):vnd(query.data.financialSummary.fundraisingGoal)],
                [tr("Lượt đóng góp thành công"),query.data.financialSummary.successfulDonationCount]
            ]}/><p className="mt-5 text-sm text-text-secondary">{tr("Các tổng chỉ tính giờ hoàn thành đã xác minh và các khoản đóng góp đã thanh toán thành công.")}</p>
        </>)}
        {renderText((completed || showPoster) && query.data && <div className="mt-6"><CampaignFinalResult title={title||tr("Chiến dịch")} data={query.data}/></div>)}
    </Card>;
}
