import { useLanguage, tr } from '../../../shared/lib/i18n';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApplications, useRecruitmentSummary } from '../../volunteers/hooks';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Pagination } from '../../../shared/components/Pagination';
import { LoadingState } from '../../../shared/components/LoadingState';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { errorMessage } from '../../../shared/api/errors';
import { useAuth } from '../../auth/store';

export function VolunteerTeamTab({
    campaignId,
    canManage,
}: {
    campaignId: string;
    canManage: boolean;
}) {
    useLanguage();
    const [page, setPage] = useState(0);
    const user = useAuth((s) => s.user);
    const query = useApplications(campaignId, { page, status: 'ACCEPTED', track: '' });
    const summary = useRecruitmentSummary(campaignId);

    if (query.isPending || summary.isPending) return <LoadingState />;
    if (query.isError)
        return (
            <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
        );

    const items = query.data?.items || [];
    const sum = summary.data;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">
                        {tr('Đội hình tình nguyện viên')}
                    </h2>
                    <p className="mt-1 text-xs text-text-secondary">
                        {canManage
                            ? tr(
                                  'Danh sách các tình nguyện viên đã được duyệt tham gia chiến dịch.',
                              )
                            : tr(
                                  'Danh sách các thành viên trong đội tình nguyện cùng đồng hành với bạn.',
                              )}
                    </p>
                </div>
                {canManage && (
                    <Link
                        to={`/manage/campaigns/${campaignId}/applications`}
                        className="ui-button ui-button-secondary text-xs"
                    >
                        {tr('Quản lý đơn đăng ký →')}
                    </Link>
                )}
            </div>

            {sum && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border border-primary-muted bg-primary-light/40 p-3 text-center">
                        <p className="text-2xl font-bold text-primary">{sum.accepted}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">{tr('Đã tiếp nhận')}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface-muted p-3 text-center">
                        <p className="text-2xl font-bold text-text-primary">
                            {sum.targetVolunteerCount ?? '—'}
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">{tr('Chỉ tiêu tổng')}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface-muted p-3 text-center">
                        <p className="text-2xl font-bold text-text-primary">
                            {sum.technical} / {sum.targetTechnicalCount ?? '—'}
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">{tr('Ban Kỹ thuật')}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-surface-muted p-3 text-center">
                        <p className="text-2xl font-bold text-text-primary">
                            {sum.logistics} / {sum.targetLogisticsCount ?? '—'}
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">{tr('Ban Hậu cần')}</p>
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <EmptyState message={tr('Chưa có tình nguyện viên nào được tiếp nhận vào đội.')} />
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((m) => {
                        const isMe = user?.id === m.userId;
                        return (
                            <Card
                                key={m.id}
                                className="relative flex items-center justify-between gap-3 p-4"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                                        {m.fullName ? m.fullName.charAt(0).toUpperCase() : 'V'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="truncate font-semibold text-sm text-text-primary">
                                                {m.fullName}
                                            </p>
                                            {isMe && (
                                                <span className="rounded bg-primary px-1.5 py-0.2 text-[10px] font-bold text-white">
                                                    {tr('Bạn')}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-text-secondary font-mono">
                                            {m.studentId}
                                        </p>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <Badge
                                        tone={
                                            m.assignedTrack === 'TECHNICAL' ? 'neutral' : 'success'
                                        }
                                    >
                                        {m.assignedTrack === 'TECHNICAL'
                                            ? tr('Kỹ thuật')
                                            : tr('Hậu cần')}
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
