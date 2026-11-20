import { useLanguage, tr, renderText } from '../../../shared/lib/i18n';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCoordinationQuery } from '../../coordination/hooks';
import * as meetingsApi from '../../meetings/api';
import { date } from '../../coordination/components';
import { meetingTypes } from '../../coordination/types';
import { Card } from '../../../shared/components/Card';
import { Badge } from '../../../shared/components/Badge';
import { Pagination } from '../../../shared/components/Pagination';
import { LoadingState } from '../../../shared/components/LoadingState';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { errorMessage } from '../../../shared/api/errors';

export function MeetingsTab({ campaignId, canManage }: { campaignId: string; canManage: boolean }) {
    useLanguage();
    const [page, setPage] = useState(0);
    const q = useCoordinationQuery(['meetings', campaignId, page], () =>
        meetingsApi.list(campaignId, page),
    );

    if (q.isPending) return <LoadingState />;
    if (q.isError)
        return <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />;

    const items = q.data?.items || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">
                        {tr('Lịch họp chiến dịch')}
                    </h2>
                    <p className="mt-1 text-xs text-text-secondary">
                        {canManage
                            ? tr(
                                  'Quản lý các buổi họp trao đổi và triển khai hoạt động của đội tình nguyện.',
                              )
                            : tr(
                                  'Lịch các buổi họp của đội tình nguyện. Vui lòng tham gia đúng giờ.',
                              )}
                    </p>
                </div>
                {canManage && (
                    <Link
                        to={`/manage/campaigns/${campaignId}/meetings`}
                        className="ui-button ui-button-primary text-xs"
                    >
                        + {tr('Tạo lịch họp mới')}
                    </Link>
                )}
            </div>

            {items.length === 0 ? (
                <EmptyState message={tr('Chưa có lịch họp nào được lên kế hoạch.')} />
            ) : (
                <div className="space-y-4">
                    {items.map((m) => (
                        <Card key={m.id} className="p-5 space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <h3 className="text-base font-bold text-text-primary">
                                        {m.title}
                                    </h3>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                                        <Badge
                                            tone={
                                                m.meetingType === 'ONLINE' ? 'neutral' : 'success'
                                            }
                                        >
                                            {renderText(meetingTypes[m.meetingType])}
                                        </Badge>
                                        <span>
                                            📅 {renderText(date(m.startsAt))} –{' '}
                                            {renderText(date(m.endsAt))}
                                        </span>
                                    </div>
                                </div>
                                {m.meetingUrl && (
                                    <a
                                        href={m.meetingUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="ui-button ui-button-primary text-xs font-semibold"
                                    >
                                        🔗 {tr('Tham gia cuộc họp')}
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
                                    📍 <strong>{tr('Địa điểm: ')}</strong>
                                    {m.location}
                                </p>
                            )}

                            {canManage && (
                                <div className="pt-2 flex justify-end">
                                    <Link
                                        to={`/manage/campaigns/${campaignId}/meetings`}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        {tr('Chỉnh sửa trong trang quản lý →')}
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
