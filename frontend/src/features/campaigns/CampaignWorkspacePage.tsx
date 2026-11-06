import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {displayName} from '../../shared/lib/demoPresentation';
import {CampaignNavigation} from './components/CampaignNavigation';
import {CampaignDashboard} from '../dashboard/CampaignDashboard';
import {useState} from 'react';
import {useParams, Link} from 'react-router-dom';
import {useCampaign, useTransitionCampaign} from './hooks';
import {useAuth} from '../auth/store';
import {campaignStatuses} from './presentation';
import type {CampaignAction, CampaignStatus} from './types';
import {PlanForm} from './components/PlanForm';
import {CampaignSkills} from './components/CampaignSkills';
import {CampaignGallery} from './CampaignGallery';
import {errorMessage} from '../../shared/api/errors';
import {Card} from '../../shared/components/Card';
import {Badge} from '../../shared/components/Badge';
import {Button} from '../../shared/components/Button';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';

const commands: Record<CampaignStatus, {command: CampaignAction['command']; label: string}[]> = {
    DRAFT: [
        {command: 'open', label: 'Mở tuyển chiến dịch'},
        {command: 'cancel', label: 'Hủy chiến dịch'}
    ],
    OPEN: [
        {command: 'start', label: 'Bắt đầu chiến dịch'},
        {command: 'cancel', label: 'Hủy chiến dịch'}
    ],
    ACTIVE: [
        {command: 'complete', label: 'Hoàn thành chiến dịch'}
    ],
    COMPLETED: [],
    CANCELLED: []
};

export function CampaignWorkspacePage() {
    useLanguage();
    const {campaignId = ''} = useParams();
    return <CampaignWorkspace key={campaignId} campaignId={campaignId} />;
}

function CampaignWorkspace({campaignId}: {campaignId: string}) {
    useLanguage();
    const query = useCampaign(campaignId);
    const mutation = useTransitionCampaign(campaignId);
    const user = useAuth(s => s.user);
    const [action, setAction] = useState<CampaignAction | null>(null);
    const [reload, setReload] = useState(false);

    if (query.isPending) return <LoadingState />;
    if (query.isError) return <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />;

    const c = query.data;
    if (!c.ownRole && user?.role !== 'ADMIN') return <ErrorState message={tr("Bạn cần quyền quản lý chiến dịch.")} />;

    const canEdit = c.canManage && c.status !== 'ACTIVE' && c.status !== 'COMPLETED' && c.status !== 'CANCELLED';

    return (
        <div className="campaign-workspace space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                    <p className="eyebrow mb-2 text-primary">{tr("KHÔNG GIAN CHIẾN DỊCH")}</p>
                    <h1 className="break-words text-3xl font-bold">{renderText(displayName(c.content.title))}</h1>
                    <div className="mt-3">
                        <Badge tone={campaignStatuses[c.status].tone}>{renderText(campaignStatuses[c.status].label)}</Badge>
                    </div>
                </div>
                <Button variant="secondary" onClick={() => setReload(true)}>
                    {tr("Tải lại chiến dịch")}
                </Button>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
                <Link className="ui-button ui-button-secondary" to={'/campaigns/' + c.slug}>
                    {tr("Xem trang công khai →")}
                </Link>
                <Link className="ui-button ui-button-secondary" to="/manage/campaigns">
                    {tr("← Chiến dịch tôi quản lý")}
                </Link>
            </div>

            <CampaignNavigation id={c.id} mode={c.content.contributionMode} />

            <CampaignDashboard
                campaignId={c.id}
                title={c.content.title}
                completed={c.status === 'COMPLETED'}
                mode={c.content.contributionMode}
            />

            <Card>
                <h2 className="mb-4 text-xl font-semibold">{tr("Trạng thái chiến dịch")}</h2>
                {c.canManage && commands[c.status].length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        {commands[c.status].map(a => (
                            <Button
                                key={a.command}
                                disabled={mutation.isPending}
                                onClick={() => setAction({command: a.command, version: c.version})}
                            >
                                {renderText(a.label)}
                            </Button>
                        ))}
                    </div>
                )}
                {c.status === 'ACTIVE' && (
                    <p className="mt-2 text-xs text-text-secondary">
                        {tr("Chiến dịch đang diễn ra. Khi các hoạt động kết thúc, bấm 'Hoàn thành chiến dịch' để chuyển sang tổng kết.")}
                    </p>
                )}
                {mutation.isError && (
                    <div className="mt-4">
                        <ErrorState message={errorMessage(mutation.error)} />
                    </div>
                )}
                {mutation.isSuccess && (
                    <p role="status" className="mt-4 text-success">
                        {tr("Đã cập nhật trạng thái chiến dịch.")}
                    </p>
                )}
            </Card>

            {canEdit ? (
                <Card>
                    <h2 className="mb-5 text-xl font-semibold">{tr("Chỉnh sửa chiến dịch")}</h2>
                    <PlanForm
                        key={c.id}
                        kind="campaign"
                        id={c.id}
                        content={c.content}
                        version={c.version}
                        categoryName={c.categoryName}
                        organizationName={c.organizerName}
                        modeLocked={c.status !== 'DRAFT'}
                    />
                </Card>
            ) : c.status === 'ACTIVE' ? (
                <Card>
                    <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/60 p-4 text-sm text-sky-800">
                        <span className="text-xl">🔒</span>
                        <div>
                            <p className="font-semibold">{tr("Chiến dịch đang hoạt động")}</p>
                            <p className="mt-1 text-xs text-sky-700">
                                {tr("Sau khi chiến dịch đã bắt đầu, thông tin chiến dịch không thể chỉnh sửa và không thể hủy bỏ.")}
                            </p>
                        </div>
                    </div>
                </Card>
            ) : null}

            <CampaignGallery campaignId={c.id} canManage={c.canManage} />

            <Card>
                <div className="flex items-start gap-4">
                    <div className="icon-tile">
                        <span aria-hidden="true">✓</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">{tr("Quản trị viên chiến dịch")}</h2>
                        <p className="mt-2 text-sm text-text-secondary">
                            {tr("Mỗi chiến dịch có một quản trị viên duy nhất: người đề xuất chiến dịch. Chỉ người này có quyền chỉnh sửa và điều phối; quản trị hệ thống chỉ duyệt hoặc từ chối đề xuất.")}
                        </p>
                    </div>
                </div>
            </Card>

            {canEdit && (
                <Card>
                    <CampaignSkills key={c.id} campaign={c} />
                </Card>
            )}

            {!c.canManage && <p className="text-text-secondary">{tr("Chiến dịch hiện chỉ cho phép xem.")}</p>}

            <ConfirmDialog
                open={action !== null}
                title={action ? commands[c.status]?.find(a => a.command === action.command)?.label + '?' : ''}
                message={
                    action?.command === 'complete' || action?.command === 'cancel'
                        ? tr("Đây là trạng thái cuối cùng. Chiến dịch không thể mở lại hoặc chỉnh sửa.")
                        : tr("Xác nhận chuyển trạng thái chiến dịch.")
                }
                busy={mutation.isPending}
                confirmLabel={tr("Xác nhận")}
                onClose={() => setAction(null)}
                onConfirm={() => {
                    if (action) mutation.mutate(action, {onSettled: () => setAction(null)});
                }}
            />

            <ConfirmDialog
                open={reload}
                title={tr("Tải lại chiến dịch?")}
                message={tr("Các thay đổi chưa lưu sẽ bị mất.")}
                confirmLabel={tr("Tải lại")}
                onClose={() => setReload(false)}
                onConfirm={() => window.location.reload()}
            />
        </div>
    );
}
