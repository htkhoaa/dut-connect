import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage, tr, locale } from '../../shared/lib/i18n';
import * as api from './api';
import { Dialog } from '../../shared/components/Dialog';
import { Button } from '../../shared/components/Button';
import { Icon } from '../../shared/components/Icon';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorState } from '../../shared/components/ErrorState';
import { EmptyState } from '../../shared/components/EmptyState';
import { Pagination } from '../../shared/components/Pagination';
import { errorMessage } from '../../shared/api/errors';

export function NotificationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    useLanguage();
    const qc = useQueryClient();
    const [page, setPage] = useState(0);
    const [filterUnread, setFilterUnread] = useState(false);
    const list = useQuery({
        queryKey: ['notifications', 'modal', filterUnread, filterUnread ? 0 : page],
        queryFn: () =>
            filterUnread ? api.getUnreadNotifications() : api.getNotifications(page, 15),
        enabled: open,
    });
    const refresh = () => void qc.invalidateQueries({ queryKey: ['notifications'] });
    const markRead = useMutation({ mutationFn: api.markAsRead, onSuccess: refresh });
    const markAll = useMutation({ mutationFn: api.markAllAsRead, onSuccess: refresh });
    const totalPages = list.data?.totalPages ?? 0;
    useEffect(() => {
        if (list.isSuccess && page >= Math.max(1, totalPages)) setPage(Math.max(0, totalPages - 1));
    }, [list.isSuccess, page, totalPages]);
    useEffect(() => {
        if (!open) {
            setPage(0);
            setFilterUnread(false);
        }
    }, [open]);
    const items = filterUnread
        ? list.data?.content.slice(page * 15, (page + 1) * 15)
        : list.data?.content;
    const actionError = markRead.error || markAll.error;
    if (!open) return null;
    return (
        <Dialog
            open={open}
            title={tr('Tất cả thông báo')}
            onClose={onClose}
            className="max-w-xl max-h-[85vh] overflow-y-auto"
        >
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-2" aria-label={tr('Lọc thông báo')}>
                        {[false, true].map((unread) => (
                            <Button
                                key={String(unread)}
                                variant={filterUnread === unread ? 'primary' : 'secondary'}
                                aria-pressed={filterUnread === unread}
                                onClick={() => {
                                    setFilterUnread(unread);
                                    setPage(0);
                                }}
                            >
                                {tr(unread ? 'Chưa đọc' : 'Tất cả')}
                            </Button>
                        ))}
                    </div>
                    <Button
                        variant="secondary"
                        disabled={markAll.isPending || !list.data?.totalElements}
                        onClick={() => markAll.mutate()}
                    >
                        {tr('Đọc tất cả')}
                    </Button>
                </div>
                {actionError && <ErrorState message={errorMessage(actionError)} />}
                {list.isPending ? (
                    <LoadingState message={tr('Đang tải thông báo…')} />
                ) : list.isError ? (
                    <ErrorState
                        message={errorMessage(list.error)}
                        onRetry={() => void list.refetch()}
                    />
                ) : !items?.length ? (
                    <EmptyState message={tr('Không có thông báo nào.')} />
                ) : (
                    <div className="divide-y divide-border">
                        {items.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                disabled={markRead.isPending}
                                onClick={() => {
                                    if (!item.isRead) markRead.mutate(item.id);
                                }}
                                className={`flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-surface-muted ${item.isRead ? '' : 'bg-primary-light'}`}
                            >
                                <Icon
                                    name={item.isRead ? 'check' : 'bell'}
                                    className="shrink-0 text-primary"
                                />
                                <span className="min-w-0 flex-1 space-y-1">
                                    <span className="block break-words text-sm font-semibold">
                                        {item.title}
                                    </span>
                                    <span className="block break-words text-xs text-text-secondary">
                                        {item.body}
                                    </span>
                                    <span className="block text-xs text-text-secondary">
                                        {new Date(item.createdAt).toLocaleString(locale())}
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                )}
                {totalPages > 1 && (
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        hasPrevious={page > 0}
                        hasNext={page + 1 < totalPages}
                        onPageChange={setPage}
                    />
                )}
                <div className="flex justify-end">
                    <Button variant="secondary" onClick={onClose}>
                        {tr('Đóng')}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
