import {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {useLanguage, tr, renderText} from '../../shared/lib/i18n';
import * as api from './api';
import {Icon} from '../../shared/components/Icon';
import {Button} from '../../shared/components/Button';
import {LoadingState} from '../../shared/components/LoadingState';
import {EmptyState} from '../../shared/components/EmptyState';

function notificationIcon(type: string) {
    if (type.includes('DONATION')) return 'heart';
    if (type.includes('VOLUNTEER')) return 'users';
    if (type.includes('PROPOSAL')) return 'file';
    return 'spark';
}

function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return tr("Vừa xong");
    if (diff < 3600) return `${Math.floor(diff / 60)} ${tr("phút trước")}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${tr("giờ trước")}`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
}

export function NotificationModal({open, onClose}: {open: boolean; onClose: () => void}) {
    useLanguage();
    const qc = useQueryClient();
    const [page, setPage] = useState(0);
    const [filterUnread, setFilterUnread] = useState(false);

    const listQuery = useQuery({
        queryKey: ['notifications', 'modal', page],
        queryFn: () => api.getNotifications(page, 15),
        enabled: open,
    });

    const markReadMutation = useMutation({
        mutationFn: api.markAsRead,
        onSuccess: () => void qc.invalidateQueries({queryKey: ['notifications']}),
    });

    const markAllReadMutation = useMutation({
        mutationFn: api.markAllAsRead,
        onSuccess: () => void qc.invalidateQueries({queryKey: ['notifications']}),
    });

    if (!open) return null;

    const items = listQuery.data?.content ?? [];
    const displayedItems = filterUnread ? items.filter(n => !n.isRead) : items;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-border">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
                            <Icon name="bell" size={18} />
                        </span>
                        <div>
                            <h2 className="text-base font-bold text-text-primary">{tr("Tất cả thông báo")}</h2>
                            <p className="text-xs text-text-secondary">{tr("Cập nhật các hoạt động mới nhất của bạn")}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            className="text-xs px-2.5 py-1.5"
                            disabled={markAllReadMutation.isPending}
                            onClick={() => markAllReadMutation.mutate()}
                        >
                            {tr("Đọc tất cả")}
                        </Button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-muted hover:text-text-primary"
                        >
                            <Icon name="close" size={18} />
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 border-b border-border/60 px-6 py-2 bg-surface-muted/30">
                    <button
                        type="button"
                        onClick={() => setFilterUnread(false)}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                            !filterUnread ? 'bg-primary text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {tr("Tất cả")}
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterUnread(true)}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                            filterUnread ? 'bg-primary text-white shadow-2xs' : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        {tr("Chưa đọc")}
                    </button>
                </div>

                {/* List Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-border/40">
                    {listQuery.isPending ? (
                        <LoadingState message={tr("Đang tải thông báo…")} />
                    ) : displayedItems.length === 0 ? (
                        <EmptyState message={tr("Không có thông báo nào.")} />
                    ) : (
                        displayedItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    if (!item.isRead) markReadMutation.mutate(item.id);
                                }}
                                className={`flex items-start gap-3 rounded-xl p-3 cursor-pointer transition-colors ${
                                    item.isRead ? 'bg-white hover:bg-surface-muted/50' : 'bg-primary-light/40 hover:bg-primary-light/60 font-medium'
                                }`}
                            >
                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                    item.isRead ? 'bg-surface-muted text-text-secondary' : 'bg-primary text-white'
                                }`}>
                                    <Icon name={notificationIcon(item.type)} size={16} />
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className={`text-sm ${item.isRead ? 'text-text-primary font-normal' : 'text-text-primary font-bold'}`}>
                                            {renderText(item.title)}
                                        </h3>
                                        <span className="text-[11px] text-text-secondary shrink-0">
                                            {timeAgo(item.createdAt)}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">
                                        {renderText(item.body)}
                                    </p>
                                </div>
                                {!item.isRead && (
                                    <span className="h-2 w-2 rounded-full bg-primary shrink-0 self-center" />
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Pagination */}
                {listQuery.data && listQuery.data.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-border px-6 py-3 bg-surface-muted/20">
                        <Button
                            variant="secondary"
                            disabled={page === 0}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            className="text-xs"
                        >
                            {tr("Trang trước")}
                        </Button>
                        <span className="text-xs text-text-secondary">
                            {tr("Trang")} {page + 1} / {listQuery.data.totalPages}
                        </span>
                        <Button
                            variant="secondary"
                            disabled={page + 1 >= listQuery.data.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="text-xs"
                        >
                            {tr("Trang sau")}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
