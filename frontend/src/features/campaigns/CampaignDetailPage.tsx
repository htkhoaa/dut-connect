import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useState} from 'react';
import {useParams, Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {apiClient} from '../../shared/api/client';
import {useCampaign, useTransitionCampaign} from './hooks';
import {useApplications} from '../volunteers/hooks';
import {useAuth} from '../auth/store';
import {campaignStatuses, modes} from './presentation';
import {campaignVisual, isDemoContent} from './visuals';
import {PlanContent} from './components/PlanContent';
import {catalogLabel} from '../../shared/lib/catalogLabels';
import {errorMessage} from '../../shared/api/errors';
import {Card} from '../../shared/components/Card';
import {Badge} from '../../shared/components/Badge';
import {Button} from '../../shared/components/Button';
import {Icon} from '../../shared/components/Icon';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {Dialog} from '../../shared/components/Dialog';
import {ApplyPanel} from '../volunteers/ApplyPanel';
import {DonationPanel} from '../donations/DonationPanel';
import {FinancialSummaryCard} from '../finance/FinancialSummaryCard';
import {displayName} from '../../shared/lib/demoPresentation';
import {CampaignShare} from './components/CampaignShare';
import {CampaignGallery} from './CampaignGallery';
import {CampaignActivityFeed} from './CampaignActivityFeed';
import {CampaignFinalResult} from '../dashboard/CampaignFinalResult';
import {useCampaignDashboard} from '../dashboard/hooks';
import {
    VolunteerTeamTab,
    MeetingsTab,
    TasksTab,
    AttendanceTab
} from './components/CampaignCoordinationTabs';

type TabKey = 'description' | 'team' | 'meetings' | 'tasks' | 'attendance';

export function CampaignDetailPage() {
    useLanguage();
    const {id = ''} = useParams();
    const query = useCampaign(id);
    const {user} = useAuth();
    const [activeTab, setActiveTab] = useState<TabKey>('description');

    // Query logged in user's own applications for this campaign
    const myApps = useApplications(id, {page: 0, status: '', track: ''}, true);
    const [showEndModal, setShowEndModal] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const transitionMutation = useTransitionCampaign(id);
    const dashboardQuery = useCampaignDashboard(id);
    const galleryQuery = useQuery({
        queryKey: ['campaign-gallery', id],
        queryFn: async () => (await apiClient.get<Array<{id: string; imageUrl: string}>>(`/campaigns/${id}/gallery`)).data,
    });

    if (query.isPending) return <LoadingState />;
    if (query.isError) return <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />;

    const c = query.data;

    // Check if user is in volunteer team (accepted) or is campaign manager / admin
    const isAcceptedVolunteer = myApps.data?.items?.some(a => a.status === 'ACCEPTED') || false;
    const isManager = c.canManage || user?.role === 'ADMIN';
    const canAccessCoordination = (c.content.contributionMode !== 'DONATION_ONLY') && (isAcceptedVolunteer || isManager);

    const tabs: {key: TabKey; label: string; icon: string}[] = [
        {key: 'description', label: tr("Mô tả"), icon: '📄'},
        {key: 'team', label: tr("Đội tình nguyện"), icon: '👥'},
        {key: 'meetings', label: tr("Lịch họp"), icon: '📅'},
        {key: 'tasks', label: tr("Nhiệm vụ"), icon: '✓'},
        {key: 'attendance', label: tr("Điểm danh"), icon: '📱'},
    ];

    return (
        <div className="space-y-7">
            <Link className="ui-button ui-button-secondary" to="/campaigns">
                <span aria-hidden="true">←</span>
                {tr("Khám phá chiến dịch")}
            </Link>

            <section className="detail-hero">
                <img
                    src={galleryQuery.data && galleryQuery.data.length > 0 ? galleryQuery.data[0].imageUrl : campaignVisual(c.categoryName, c.content.title).image}
                    alt={campaignVisual(c.categoryName, c.content.title).alt}
                />
                <div className="detail-hero-shade" />
                <div className="detail-hero-copy">
                    <div className="mb-4 flex flex-wrap gap-2">
                        <Badge tone={campaignStatuses[c.status].tone}>
                            {renderText(campaignStatuses[c.status].label)}
                        </Badge>
                        <span className="detail-tag">{renderText(catalogLabel(c.categoryName))}</span>
                        {renderText(isDemoContent(c.content.description) && <span className="detail-tag">{tr("Dữ liệu mẫu")}</span>)}
                    </div>
                    <h1>{renderText(displayName(c.content.title))}</h1>
                    <p className="mt-3 max-w-2xl text-sm text-white/85">{renderText(c.content.summary)}</p>
                    <p className="mt-5 flex items-center gap-2 text-sm">
                        <Icon name="building" size={17} />
                        {renderText(displayName(c.organizerName))}
                    </p>
                </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm text-text-secondary">
                    <Icon name="users" size={17} />
                    {renderText(modes[c.content.contributionMode])}
                    <span className="mx-1">·</span>
                    {tr("Liên hệ:")} {renderText(c.primaryContactName)}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <CampaignShare title={displayName(c.content.title)} />
                    {isManager && (
                        <>
                            {c.status !== 'COMPLETED' && c.status !== 'CANCELLED' ? (
                                <Button
                                    variant="secondary"
                                    className="border-danger/40 text-danger hover:bg-danger/10 text-xs font-semibold py-1.5 px-3"
                                    onClick={() => setShowEndModal(true)}
                                    disabled={transitionMutation.isPending}
                                >
                                    🏁 {tr("Kết thúc chiến dịch")}
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    className="text-xs font-semibold py-1.5 px-3 shadow-xs"
                                    onClick={() => setShowResultModal(true)}
                                >
                                    🖼️ {tr("Tạo poster kết quả")}
                                </Button>
                            )}
                            <Link className="ui-button ui-button-secondary text-xs py-1.5 px-3" to={'/manage/campaigns/' + c.id}>
                                <Icon name="grid" size={15} />
                                {tr("Quản lý chiến dịch")}
                            </Link>
                        </>
                    )}
                </div>
            </div>

            <div className="detail-grid">
                <div className="min-w-0 space-y-6">
                    {/* Financial summary at the very top for campaigns with donations */}
                    {c.content.contributionMode !== 'VOLUNTEER_ONLY' && (
                        <FinancialSummaryCard campaignId={c.id} />
                    )}

                    {/* Tab Navigation for Accepted Volunteers and Managers */}
                    {canAccessCoordination && (
                        <div className="rounded-2xl border border-border bg-surface p-2 shadow-xs">
                            <div className="flex items-center justify-between px-2 py-1.5 border-b border-border mb-2">
                                <span className="text-xs font-semibold text-text-secondary">
                                    {isManager ? tr("Không gian điều phối chiến dịch") : tr("Khu vực Đội tình nguyện")}
                                </span>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isManager ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
                                    {isManager ? tr("Quản trị viên") : tr("Thành viên chính thức (Chỉ xem)")}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                                            activeTab === tab.key
                                                ? 'bg-primary text-white shadow-xs'
                                                : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                                        }`}
                                    >
                                        <span>{tab.icon}</span>
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tab Content Display */}
                    {activeTab === 'description' && (
                        <>
                            <Card>
                                <h2 className="mb-5 text-xl font-semibold">{tr("Về chiến dịch")}</h2>
                                <PlanContent
                                    content={c.content}
                                    organizerName={c.organizerName}
                                    categoryName={c.categoryName}
                                />
                            </Card>

                            <CampaignGallery campaignId={c.id} canManage={c.canManage} />

                            <Card>
                                <h2 className="mb-4 text-xl font-semibold">{tr("Kỹ năng cần có")}</h2>
                                {renderText(
                                    c.skills.length ? (
                                        <div className="flex flex-wrap gap-3">
                                            {renderText(
                                                c.skills.map(s => (
                                                    <div
                                                        key={s.skillId + s.track}
                                                        className="rounded-xl border border-border bg-surface-muted px-4 py-3"
                                                    >
                                                        <p className="text-sm font-semibold">
                                                            {renderText(catalogLabel(s.name))}
                                                        </p>
                                                        <p className="mt-1 text-xs text-text-secondary">
                                                            {renderText(s.track === 'TECHNICAL' ? tr("Kỹ thuật") : 'Hậu cần')}{' '}
                                                            · {tr("Mức quan trọng: ")}
                                                            {renderText(s.importance)}/5
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-text-secondary">
                                            {tr("Chưa có yêu cầu kỹ năng cụ thể.")}
                                        </p>
                                    )
                                )}
                            </Card>
                        </>
                    )}

                    {activeTab === 'team' && canAccessCoordination && (
                        <VolunteerTeamTab campaignId={c.id} canManage={c.canManage} />
                    )}

                    {activeTab === 'meetings' && canAccessCoordination && (
                        <MeetingsTab campaignId={c.id} canManage={c.canManage} />
                    )}

                    {activeTab === 'tasks' && canAccessCoordination && (
                        <TasksTab campaignId={c.id} canManage={c.canManage} />
                    )}

                    {activeTab === 'attendance' && canAccessCoordination && (
                        <AttendanceTab campaignId={c.id} canManage={c.canManage} />
                    )}
                </div>

                <aside className="min-w-0 space-y-5">
                    {c.status === 'COMPLETED' ? (
                        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/90 p-5 text-center shadow-xs">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-lg">
                                ✓
                            </span>
                            <h3 className="text-base font-bold text-emerald-950 mt-2">{tr("Chiến dịch đã kết thúc")}</h3>
                            <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                                {tr("Chiến dịch hiện đã hoàn thành và ngừng tiếp nhận đóng góp. Chân thành cảm ơn sự chung tay tiếp sức của bạn!")}
                            </p>
                            {isManager && (
                                <Button
                                    variant="primary"
                                    className="mt-4 w-full text-xs font-semibold"
                                    onClick={() => setShowResultModal(true)}
                                >
                                    🖼️ {tr("Tạo poster kết quả")}
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            {user?.role !== 'ADMIN' && c.content.contributionMode !== 'DONATION_ONLY' && (
                                <ApplyPanel key={c.id} campaign={c} />
                            )}
                            <DonationPanel key={'donation-' + c.id} campaign={c} />
                        </>
                    )}
                    <div className="rounded-2xl border border-primary-muted bg-primary-light p-5">
                        <Icon name="shield" className="mb-3 text-primary" />
                        <h2 className="text-sm font-semibold">{tr("Đóng góp có trách nhiệm")}</h2>
                        <p className="mt-2 text-sm text-text-secondary">
                            {tr(
                                "Đăng ký sẽ được ban tổ chức xét duyệt. Các khoản đóng góp được xác nhận qua hệ thống và chi phí được công khai sau khi duyệt."
                            )}
                        </p>
                    </div>
                    <CampaignActivityFeed campaignId={c.id} />
                </aside>
            </div>

            {/* Confirm End Campaign Early Dialog */}
            <ConfirmDialog
                open={showEndModal}
                title={tr("Kết thúc chiến dịch sớm?")}
                message={tr("Sau khi kết thúc, chiến dịch sẽ chuyển sang chế độ Chỉ đọc (Read-only), ngừng nhận ủng hộ và nút này sẽ chuyển thành 'Tạo poster kết quả'. Bạn có chắc chắn muốn kết thúc chiến dịch?")}
                confirmLabel={tr("Xác nhận kết thúc")}
                busy={transitionMutation.isPending}
                onClose={() => setShowEndModal(false)}
                onConfirm={() => {
                    transitionMutation.mutate({command: 'complete', version: c.version}, {
                        onSettled: () => setShowEndModal(false),
                    });
                }}
            />

            {/* Final Result Poster Modal */}
            {showResultModal && (
                <Dialog open={true} title={tr("Poster kết quả chiến dịch")} onClose={() => setShowResultModal(false)}>
                    {dashboardQuery.data ? (
                        <div className="space-y-4">
                            <CampaignFinalResult title={c.content.title} data={dashboardQuery.data} />
                            <div className="flex justify-end pt-2">
                                <Button variant="secondary" onClick={() => setShowResultModal(false)}>
                                    {tr("Đóng")}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <LoadingState message={tr("Đang tải dữ liệu tổng kết…")} />
                    )}
                </Dialog>
            )}
        </div>
    );
}
