import {useLanguage, tr, renderText} from "../../../shared/lib/i18n";
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useApplications, useRecruitmentSummary} from '../../volunteers/hooks';
import {useCoordinationQuery, useCoordinationMutation} from '../../coordination/hooks';
import * as meetingsApi from '../../meetings/api';
import * as tasksApi from '../../tasks/api';
import * as attendanceApi from '../../attendance/api';
import {date} from '../../coordination/components';
import {meetingTypes, taskStatuses, type Session} from '../../coordination/types';
import {Card} from '../../../shared/components/Card';
import {Button} from '../../../shared/components/Button';
import {Badge} from '../../../shared/components/Badge';
import {Dialog} from '../../../shared/components/Dialog';
import {Pagination} from '../../../shared/components/Pagination';
import {LoadingState} from '../../../shared/components/LoadingState';
import {EmptyState} from '../../../shared/components/EmptyState';
import {ErrorState} from '../../../shared/components/ErrorState';
import {errorMessage} from '../../../shared/api/errors';
import {useAuth} from '../../auth/store';

// ----------------------------------------------------
// 1. Volunteer Team Tab
// ----------------------------------------------------
export function VolunteerTeamTab({campaignId, canManage}: {campaignId: string; canManage: boolean}) {
    useLanguage();
    const [page, setPage] = useState(0);
    const user = useAuth(s => s.user);
    const query = useApplications(campaignId, {page, status: 'ACCEPTED', track: ''});
    const summary = useRecruitmentSummary(campaignId);

    if (query.isPending || summary.isPending) return <LoadingState />;
    if (query.isError) return <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />;

    const items = query.data?.items || [];
    const sum = summary.data;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">{tr("Đội hình tình nguyện viên")}</h2>
                    <p className="mt-1 text-xs text-text-secondary">
                        {canManage
                            ? tr("Danh sách các tình nguyện viên đã được duyệt tham gia chiến dịch.")
                            : tr("Danh sách các thành viên trong đội tình nguyện cùng đồng hành với bạn.")}
                    </p>
                </div>
                {canManage && (
                    <Link to={`/manage/campaigns/${campaignId}/applications`} className="ui-button ui-button-secondary text-xs">
                        {tr("Quản lý đơn đăng ký →")}
                    </Link>
                )}
            </div>

            {sum && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-primary-muted bg-primary-light/40 p-3 text-center">
                        <p className="text-2xl font-bold text-primary">{sum.accepted}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">{tr("Đã tiếp nhận")}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface-muted p-3 text-center">
                        <p className="text-2xl font-bold text-text-primary">{sum.targetVolunteerCount ?? '—'}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">{tr("Chỉ tiêu tổng")}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface-muted p-3 text-center">
                        <p className="text-2xl font-bold text-text-primary">{sum.technical} / {sum.targetTechnicalCount ?? '—'}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">{tr("Ban Kỹ thuật")}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface-muted p-3 text-center">
                        <p className="text-2xl font-bold text-text-primary">{sum.logistics} / {sum.targetLogisticsCount ?? '—'}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">{tr("Ban Hậu cần")}</p>
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <EmptyState message={tr("Chưa có tình nguyện viên nào được tiếp nhận vào đội.")} />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {items.map(m => {
                        const isMe = user?.id === m.userId;
                        return (
                            <Card key={m.id} className="relative flex items-center justify-between gap-3 p-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                                        {m.fullName ? m.fullName.charAt(0).toUpperCase() : 'V'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="truncate font-semibold text-sm text-text-primary">{m.fullName}</p>
                                            {isMe && (
                                                <span className="rounded bg-primary px-1.5 py-0.2 text-[10px] font-bold text-white">
                                                    {tr("Bạn")}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-text-secondary font-mono">{m.studentId}</p>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <Badge tone={m.assignedTrack === 'TECHNICAL' ? 'neutral' : 'success'}>
                                        {m.assignedTrack === 'TECHNICAL' ? tr("Kỹ thuật") : tr("Hậu cần")}
                                    </Badge>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {query.data && <Pagination {...query.data} onPageChange={setPage} />}
        </div>
    );
}

// ----------------------------------------------------
// 2. Meetings Tab
// ----------------------------------------------------
export function MeetingsTab({campaignId, canManage}: {campaignId: string; canManage: boolean}) {
    useLanguage();
    const [page, setPage] = useState(0);
    const q = useCoordinationQuery(['meetings', campaignId, page], () => meetingsApi.list(campaignId, page));

    if (q.isPending) return <LoadingState />;
    if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />;

    const items = q.data?.items || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">{tr("Lịch họp chiến dịch")}</h2>
                    <p className="mt-1 text-xs text-text-secondary">
                        {canManage
                            ? tr("Quản lý các buổi họp trao đổi và triển khai hoạt động của đội tình nguyện.")
                            : tr("Lịch các buổi họp của đội tình nguyện. Vui lòng tham gia đúng giờ.")}
                    </p>
                </div>
                {canManage && (
                    <Link to={`/manage/campaigns/${campaignId}/meetings`} className="ui-button ui-button-primary text-xs">
                        + {tr("Tạo lịch họp mới")}
                    </Link>
                )}
            </div>

            {items.length === 0 ? (
                <EmptyState message={tr("Chưa có lịch họp nào được lên kế hoạch.")} />
            ) : (
                <div className="space-y-4">
                    {items.map(m => (
                        <Card key={m.id} className="p-5 space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <h3 className="text-base font-bold text-text-primary">{m.title}</h3>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                                        <Badge tone={m.meetingType === 'ONLINE' ? 'neutral' : 'success'}>
                                            {renderText(meetingTypes[m.meetingType])}
                                        </Badge>
                                        <span>📅 {renderText(date(m.startsAt))} – {renderText(date(m.endsAt))}</span>
                                    </div>
                                </div>
                                {m.meetingUrl && (
                                    <a
                                        href={m.meetingUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="ui-button ui-button-primary text-xs font-semibold"
                                    >
                                        🔗 {tr("Tham gia cuộc họp")}
                                    </a>
                                )}
                            </div>

                            {m.description && (
                                <p className="whitespace-pre-wrap text-sm text-text-secondary leading-relaxed bg-surface-muted/50 p-3 rounded-xl">
                                    {m.description}
                                </p>
                            )}

                            {m.location && (
                                <p className="text-xs text-text-secondary">
                                    📍 <strong>{tr("Địa điểm: ")}</strong>{m.location}
                                </p>
                            )}

                            {canManage && (
                                <div className="pt-2 flex justify-end">
                                    <Link to={`/manage/campaigns/${campaignId}/meetings`} className="text-xs text-primary hover:underline">
                                        {tr("Chỉnh sửa trong trang quản lý →")}
                                    </Link>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {q.data && <Pagination {...q.data} onPageChange={setPage} />}
        </div>
    );
}

// ----------------------------------------------------
// 3. Tasks Tab
// ----------------------------------------------------
export function TasksTab({campaignId, canManage}: {campaignId: string; canManage: boolean}) {
    useLanguage();
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState('');
    const user = useAuth(s => s.user);

    const q = useCoordinationQuery(['tasks', campaignId, false, page, status], () =>
        tasksApi.list(campaignId, page, status)
    );

    const transitionMutation = useCoordinationMutation(async ({taskId, command, version}: {taskId: string; command: string; version: number}) => {
        return tasksApi.transition(taskId, command, version);
    });

    if (q.isPending) return <LoadingState />;
    if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />;

    const items = q.data?.items || [];

    const getStatusTone = (st: string): 'neutral' | 'success' | 'danger' => {
        switch (st) {
            case 'TODO': return 'neutral';
            case 'IN_PROGRESS': return 'neutral';
            case 'DONE': return 'success';
            case 'VERIFIED': return 'success';
            default: return 'neutral';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">{tr("Nhiệm vụ chiến dịch")}</h2>
                    <p className="mt-1 text-xs text-text-secondary">
                        {canManage
                            ? tr("Phân công, điều phối và xác minh tiến độ nhiệm vụ của đội ngũ tình nguyện.")
                            : tr("Danh sách các nhiệm vụ được phân công trong chiến dịch.")}
                    </p>
                </div>
                {canManage && (
                    <Link to={`/manage/campaigns/${campaignId}/tasks`} className="ui-button ui-button-primary text-xs">
                        + {tr("Tạo nhiệm vụ mới")}
                    </Link>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-text-secondary">{tr("Lọc trạng thái:")}</span>
                {['', 'TODO', 'IN_PROGRESS', 'DONE', 'VERIFIED'].map(st => (
                    <button
                        key={st}
                        onClick={() => {
                            setStatus(st);
                            setPage(0);
                        }}
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                            status === st
                                ? 'bg-primary text-white shadow-xs'
                                : 'bg-surface-muted text-text-secondary hover:bg-border'
                        }`}
                    >
                        {st === '' ? tr("Tất cả") : renderText(taskStatuses[st as keyof typeof taskStatuses])}
                    </button>
                ))}
            </div>

            {items.length === 0 ? (
                <EmptyState message={tr("Chưa có nhiệm vụ nào trong danh mục này.")} />
            ) : (
                <div className="space-y-4">
                    {items.map(t => {
                        const isAssigned = t.assignees?.some(a => a.userId === user?.id);
                        return (
                            <Card key={t.id} className="p-5 space-y-3">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold text-text-primary">{t.title}</h3>
                                            {isAssigned && (
                                                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                                    {tr("Được giao cho bạn")}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                                            <Badge tone={getStatusTone(t.status)}>
                                                {renderText(taskStatuses[t.status])}
                                            </Badge>
                                            <span className="font-semibold text-text-primary">
                                                {t.track === 'TECHNICAL' ? tr("Ban Kỹ thuật") : tr("Ban Hậu cần")}
                                            </span>
                                            {t.dueAt && <span>⏰ {tr("Hạn chót: ")}{renderText(date(t.dueAt))}</span>}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2">
                                        {isAssigned && t.status === 'TODO' && (
                                            <Button
                                                variant="secondary"
                                                className="text-xs"
                                                disabled={transitionMutation.isPending}
                                                onClick={() => transitionMutation.mutate({taskId: t.id, command: 'IN_PROGRESS', version: t.version})}
                                            >
                                                ▶️ {tr("Bắt đầu làm")}
                                            </Button>
                                        )}
                                        {isAssigned && t.status === 'IN_PROGRESS' && (
                                            <Button
                                                variant="primary"
                                                className="text-xs"
                                                disabled={transitionMutation.isPending}
                                                onClick={() => transitionMutation.mutate({taskId: t.id, command: 'DONE', version: t.version})}
                                            >
                                                ✓ {tr("Báo cáo hoàn thành")}
                                            </Button>
                                        )}
                                        {canManage && (
                                            <Link to={`/manage/campaigns/${campaignId}/tasks`} className="text-xs text-primary hover:underline">
                                                {tr("Chi tiết →")}
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {t.description && (
                                    <p className="whitespace-pre-wrap text-sm text-text-secondary leading-relaxed">
                                        {t.description}
                                    </p>
                                )}

                                {t.assignees && t.assignees.length > 0 && (
                                    <div className="pt-2 border-t border-border flex flex-wrap items-center gap-2 text-xs">
                                        <span className="text-text-secondary">{tr("Người thực hiện:")}</span>
                                        {t.assignees.map(a => (
                                            <span key={a.userId} className="rounded-full bg-surface-muted px-2 py-0.5 font-medium text-text-primary">
                                                {a.fullName} ({a.studentId})
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {q.data && <Pagination {...q.data} onPageChange={setPage} />}
        </div>
    );
}

// ----------------------------------------------------
// 4. Attendance Tab
// ----------------------------------------------------
export function AttendanceTab({campaignId, canManage}: {campaignId: string; canManage: boolean}) {
    useLanguage();
    const [page, setPage] = useState(0);
    const [qrModal, setQrModal] = useState<{title: string; qrImageUrl: string; checkinUrl: string} | null>(null);
    const [qrLoading, setQrLoading] = useState(false);

    const q = useCoordinationQuery(['sessions', campaignId, page], () => attendanceApi.list(campaignId, page));

    const handleGenerateQr = async (s: Session) => {
        try {
            setQrLoading(true);
            const res = await attendanceApi.generateQr(s.id);
            const fullCheckinUrl = window.location.origin + res.checkinUrl;
            setQrModal({
                title: s.title,
                qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(fullCheckinUrl)}`,
                checkinUrl: fullCheckinUrl,
            });
        } catch {
            // ignore
        } finally {
            setQrLoading(false);
        }
    };

    if (q.isPending) return <LoadingState />;
    if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />;

    const items = q.data?.items || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">{tr("Buổi điểm danh hoạt động")}</h2>
                    <p className="mt-1 text-xs text-text-secondary">
                        {canManage
                            ? tr("Tạo mã QR trình chiếu trên màn hình để tình nguyện viên quét điểm danh.")
                            : tr("Quét mã QR do ban tổ chức cung cấp trong buổi hoạt động để xác nhận tham gia.")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/attendance/checkin" className="ui-button ui-button-secondary text-xs">
                        📱 {tr("Nhập mã / Điểm danh")}
                    </Link>
                    {canManage && (
                        <Link to={`/manage/campaigns/${campaignId}/attendance`} className="ui-button ui-button-primary text-xs">
                            + {tr("Tạo buổi điểm danh")}
                        </Link>
                    )}
                </div>
            </div>

            {items.length === 0 ? (
                <EmptyState message={tr("Chưa có buổi điểm danh nào được thiết lập.")} />
            ) : (
                <div className="space-y-4">
                    {items.map(s => (
                        <Card key={s.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-text-primary">{s.title}</h3>
                                <p className="text-xs text-text-secondary">
                                    📅 {renderText(date(s.startsAt))} – {renderText(date(s.endsAt))}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {canManage ? (
                                    <Button
                                        variant="secondary"
                                        className="text-xs"
                                        disabled={qrLoading}
                                        onClick={() => handleGenerateQr(s)}
                                    >
                                        📱 {tr("Chiếu mã QR")}
                                    </Button>
                                ) : (
                                    <Link to="/attendance/checkin" className="ui-button ui-button-primary text-xs">
                                        ✓ {tr("Điểm danh ngay")}
                                    </Link>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {q.data && <Pagination {...q.data} onPageChange={setPage} />}

            {qrModal && (
                <Dialog open={true} title={tr("Mã QR Điểm Danh")} onClose={() => setQrModal(null)}>
                    <div className="space-y-4 text-center">
                        <p className="font-semibold text-text-primary">{qrModal.title}</p>
                        <p className="text-xs text-text-secondary">
                            {tr("Trình chiếu mã này trên màn hình hoặc máy chiếu để tình nguyện viên dùng điện thoại quét:")}
                        </p>
                        <div className="flex justify-center p-3">
                            <div className="rounded-2xl border border-border bg-white p-3 shadow-lg">
                                <img
                                    src={qrModal.qrImageUrl}
                                    alt="QR điểm danh"
                                    className="h-72 w-72 rounded-xl object-contain"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-text-secondary font-mono break-all bg-surface-muted p-2 rounded-lg">
                            {qrModal.checkinUrl}
                        </p>
                        <div className="pt-2 flex justify-end">
                            <Button variant="secondary" onClick={() => setQrModal(null)}>
                                {tr("Đóng")}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            )}
        </div>
    );
}
