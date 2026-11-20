import { useLanguage, tr, renderText } from '../../../shared/lib/i18n';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCoordinationQuery, useCoordinationMutation } from '../../coordination/hooks';
import * as tasksApi from '../../tasks/api';
import { date } from '../../coordination/components';
import { taskStatuses } from '../../coordination/types';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import { Pagination } from '../../../shared/components/Pagination';
import { LoadingState } from '../../../shared/components/LoadingState';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { errorMessage } from '../../../shared/api/errors';
import { useAuth } from '../../auth/store';

export function TasksTab({ campaignId, canManage }: { campaignId: string; canManage: boolean }) {
    useLanguage();
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState('');
    const user = useAuth((s) => s.user);

    const q = useCoordinationQuery(['tasks', campaignId, false, page, status], () =>
        tasksApi.list(campaignId, page, status),
    );

    const transitionMutation = useCoordinationMutation(
        async ({
            taskId,
            command,
            version,
        }: {
            taskId: string;
            command: 'start' | 'done';
            version: number;
        }) => {
            return tasksApi.transition(taskId, command, version);
        },
    );

    if (q.isPending) return <LoadingState />;
    if (q.isError)
        return <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />;

    const items = q.data?.items || [];

    const getStatusTone = (st: string): 'neutral' | 'success' | 'danger' => {
        switch (st) {
            case 'TODO':
                return 'neutral';
            case 'IN_PROGRESS':
                return 'neutral';
            case 'DONE':
                return 'success';
            case 'VERIFIED':
                return 'success';
            default:
                return 'neutral';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">
                        {tr('Nhiệm vụ chiến dịch')}
                    </h2>
                    <p className="mt-1 text-xs text-text-secondary">
                        {canManage
                            ? tr(
                                  'Phân công, điều phối và xác minh tiến độ nhiệm vụ của đội ngũ tình nguyện.',
                              )
                            : tr('Danh sách các nhiệm vụ được phân công trong chiến dịch.')}
                    </p>
                </div>
                {canManage && (
                    <Link
                        to={`/manage/campaigns/${campaignId}/tasks`}
                        className="ui-button ui-button-primary text-xs"
                    >
                        + {tr('Tạo nhiệm vụ mới')}
                    </Link>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-text-secondary">
                    {tr('Lọc trạng thái:')}
                </span>
                {['', 'TODO', 'IN_PROGRESS', 'DONE', 'VERIFIED'].map((st) => (
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
                        {st === ''
                            ? tr('Tất cả')
                            : renderText(taskStatuses[st as keyof typeof taskStatuses])}
                    </button>
                ))}
            </div>

            {transitionMutation.isError && (
                <ErrorState message={errorMessage(transitionMutation.error)} />
            )}
            {items.length === 0 ? (
                <EmptyState message={tr('Chưa có nhiệm vụ nào trong danh mục này.')} />
            ) : (
                <div className="space-y-4">
                    {items.map((t) => {
                        const isAssigned = t.assignees?.some((a) => a.userId === user?.id);
                        return (
                            <Card key={t.id} className="p-5 space-y-3">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold text-text-primary">
                                                {t.title}
                                            </h3>
                                            {isAssigned && (
                                                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                                                    {tr('Được giao cho bạn')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                                            <Badge tone={getStatusTone(t.status)}>
                                                {renderText(taskStatuses[t.status])}
                                            </Badge>
                                            <span className="font-semibold text-text-primary">
                                                {t.track === 'TECHNICAL'
                                                    ? tr('Ban Kỹ thuật')
                                                    : tr('Ban Hậu cần')}
                                            </span>
                                            {t.dueAt && (
                                                <span>
                                                    ⏰ {tr('Hạn chót: ')}
                                                    {renderText(date(t.dueAt))}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex items-center gap-2">
                                        {isAssigned && t.canProgress && t.status === 'TODO' && (
                                            <Button
                                                variant="secondary"
                                                className="text-xs"
                                                disabled={transitionMutation.isPending}
                                                onClick={() =>
                                                    transitionMutation.mutate({
                                                        taskId: t.id,
                                                        command: 'start',
                                                        version: t.version,
                                                    })
                                                }
                                            >
                                                ▶️ {tr('Bắt đầu làm')}
                                            </Button>
                                        )}
                                        {isAssigned &&
                                            t.canProgress &&
                                            t.status === 'IN_PROGRESS' && (
                                                <Button
                                                    variant="primary"
                                                    className="text-xs"
                                                    disabled={transitionMutation.isPending}
                                                    onClick={() =>
                                                        transitionMutation.mutate({
                                                            taskId: t.id,
                                                            command: 'done',
                                                            version: t.version,
                                                        })
                                                    }
                                                >
                                                    ✓ {tr('Báo cáo hoàn thành')}
                                                </Button>
                                            )}
                                        {canManage && (
                                            <Link
                                                to={`/manage/campaigns/${campaignId}/tasks`}
                                                className="text-xs text-primary hover:underline"
                                            >
                                                {tr('Chi tiết →')}
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
                                        <span className="text-text-secondary">
                                            {tr('Người thực hiện:')}
                                        </span>
                                        {t.assignees.map((a) => (
                                            <span
                                                key={a.userId}
                                                className="rounded-full bg-surface-muted px-2 py-0.5 font-medium text-text-primary"
                                            >
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
