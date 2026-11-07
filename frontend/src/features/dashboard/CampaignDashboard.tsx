import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useState} from 'react';
import {useCampaignDashboard} from './hooks';
import {MetricGrid} from './MetricGrid';
import {vnd} from '../campaigns/presentation';
import type {ContributionMode} from '../campaigns/types';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';
import {CampaignFinalResult} from './CampaignFinalResult';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {useTransitionCampaign, useCampaign} from '../campaigns/hooks';
import {useAuth} from '../auth/store';
import {useQueryClient} from '@tanstack/react-query';

export function CampaignDashboard({
    campaignId,
    title,
    completed = false,
    mode,
    canManage = false,
    campaignVersion,
    campaignStatus,
    onCampaignCompleted
}: {
    campaignId: string;
    title?: string;
    completed?: boolean;
    mode?: ContributionMode;
    canManage?: boolean;
    campaignVersion?: number;
    campaignStatus?: string;
    onCampaignCompleted?: () => void;
}) {
    useLanguage();
    const qc = useQueryClient();
    const user = useAuth(s => s.user);
    const campaignDetail = useCampaign(campaignId);
    const query = useCampaignDashboard(campaignId);
    const transitionMutation = useTransitionCampaign(campaignId);
    const currentVersion = campaignVersion ?? campaignDetail.data?.version;
    const isCompleted = completed || campaignStatus === 'COMPLETED' || campaignDetail.data?.status === 'COMPLETED';
    const hasManageAccess = canManage || Boolean(campaignDetail.data?.ownRole || campaignDetail.data?.canManage || user?.role === 'ADMIN');
    const [showPoster, setShowPoster] = useState(isCompleted);
    const [confirmEndOpen, setConfirmEndOpen] = useState(false);

    const getItems = () => {
        if (!query.data) return [];
        const volunteerItems: [string, any][] = [
            [tr("Tổng đăng ký"), query.data.operations.applications.TOTAL],
            [tr("Đăng ký chờ duyệt"), query.data.operations.applications.PENDING],
            [tr("Tình nguyện viên đã duyệt"), query.data.operations.applications.ACCEPTED],
            [tr("Đăng ký đã từ chối"), query.data.operations.applications.REJECTED],
            [tr("Đăng ký đã hủy"), query.data.operations.applications.CANCELLED],
            [tr("Đã phân công kỹ thuật"), query.data.operations.assignedTracks.TECHNICAL],
            [tr("Đã phân công hậu cần"), query.data.operations.assignedTracks.LOGISTICS],
            [tr("Nhiệm vụ cần làm"), query.data.operations.tasks.TODO],
            [tr("Nhiệm vụ đang thực hiện"), query.data.operations.tasks.IN_PROGRESS],
            [tr("Nhiệm vụ đã làm xong"), query.data.operations.tasks.DONE],
            [tr("Nhiệm vụ đã xác minh"), query.data.operations.tasks.VERIFIED],
            [tr("Buổi điểm danh"), query.data.operations.attendanceSessionCount],
            [tr("Hoàn thành đã xác minh"), query.data.operations.verifiedCompletionCount],
            [tr("Số giờ đã xác minh"), query.data.operations.verifiedVolunteerHours]
        ];

        const financialItems: [string, any][] = [
            [tr("Đã quyên góp"), vnd(query.data.financialSummary.verifiedDonations)],
            [tr("Mục tiêu gây quỹ"), query.data.financialSummary.fundraisingGoal === null ? tr("Chưa thiết lập") : vnd(query.data.financialSummary.fundraisingGoal)],
            [tr("Lượt đóng góp thành công"), query.data.financialSummary.successfulDonationCount]
        ];

        if (mode === 'DONATION_ONLY') return financialItems;
        if (mode === 'VOLUNTEER_ONLY') return volunteerItems;
        return [...volunteerItems, ...financialItems];
    };

    return (
        <Card>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{tr("Tổng quan chiến dịch")}</h2>
                <div className="flex flex-wrap gap-2">
                    {isCompleted ? (
                        <Button
                            variant="secondary"
                            onClick={() => setShowPoster(!showPoster)}
                            className="font-semibold shadow-2xs"
                        >
                            🖼️ {renderText(showPoster ? tr("Ẩn poster kết quả") : tr("Tạo poster kết quả"))}
                        </Button>
                    ) : hasManageAccess && currentVersion !== undefined ? (
                        <Button
                            variant="danger"
                            onClick={() => setConfirmEndOpen(true)}
                            disabled={transitionMutation.isPending}
                            className="font-semibold shadow-2xs"
                        >
                            🏁 {tr("Kết thúc chiến dịch")}
                        </Button>
                    ) : null}
                    <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
                        {tr("Làm mới tổng quan")}
                    </Button>
                </div>
            </div>
            {renderText(
                query.isPending ? (
                    <LoadingState />
                ) : query.isError ? (
                    <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
                ) : (
                    <>
                        <MetricGrid items={getItems()} />
                        <p className="mt-5 text-sm text-text-secondary">
                            {tr("Các tổng chỉ tính giờ hoàn thành đã xác minh và các khoản đóng góp đã thanh toán thành công.")}
                        </p>
                    </>
                )
            )}
            {renderText(
                (isCompleted && showPoster) && query.data && (
                    <div className="mt-6">
                        <CampaignFinalResult title={title || tr("Chiến dịch")} data={query.data} />
                    </div>
                )
            )}

            <ConfirmDialog
                open={confirmEndOpen}
                title={tr("Kết thúc chiến dịch sớm?")}
                message={tr("Sau khi kết thúc, chiến dịch sẽ chuyển sang trạng thái Đã hoàn thành (COMPLETED), ngừng tiếp nhận ủng hộ và nút này sẽ chuyển thành 'Tạo poster kết quả'. Bạn có chắc chắn muốn kết thúc chiến dịch?")}
                confirmLabel={tr("Xác nhận kết thúc")}
                busy={transitionMutation.isPending}
                onClose={() => setConfirmEndOpen(false)}
                onConfirm={async () => {
                    if (currentVersion !== undefined) {
                        try {
                            await transitionMutation.mutateAsync({command: 'complete', version: currentVersion});
                            setConfirmEndOpen(false);
                            setShowPoster(true);
                            void qc.invalidateQueries({queryKey: ['campaign', campaignId]});
                            void qc.invalidateQueries({queryKey: ['campaigns']});
                            void qc.invalidateQueries({queryKey: ['dashboard']});
                            onCampaignCompleted?.();
                        } catch (err) {
                            alert(errorMessage(err));
                        }
                    }
                }}
            />
        </Card>
    );
}
