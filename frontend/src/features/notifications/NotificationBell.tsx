import {useState, useRef, useEffect} from 'react';
import {useLanguage, tr, renderText} from '../../shared/lib/i18n';
import {Icon} from '../../shared/components/Icon';
import {useNotifications} from './useNotifications';
import {NotificationModal} from './NotificationModal';

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

export function NotificationBell() {
    useLanguage();
    const {unreadCount, recentNotifications, markAsRead, markAllAsRead, isMarkingAll} = useNotifications();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setDropdownOpen(o => !o)}
                aria-label={tr("Thông báo")}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-text-secondary transition-all hover:border-primary-muted hover:text-text-primary hover:shadow-xs focus:outline-none"
            >
                <Icon name="bell" size={17} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-75">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-2xl border border-border bg-white p-2 shadow-2xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 z-50">
                    <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-text-primary">{tr("Thông báo")}</span>
                            {unreadCount > 0 && (
                                <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger">
                                    {unreadCount} {tr("mới")}
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                disabled={isMarkingAll}
                                onClick={() => markAllAsRead()}
                                className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                            >
                                {tr("Đã đọc tất cả")}
                            </button>
                        )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-border/40 py-1">
                        {recentNotifications.length === 0 ? (
                            <div className="py-6 text-center text-xs text-text-secondary">
                                {tr("Bạn chưa có thông báo nào.")}
                            </div>
                        ) : (
                            recentNotifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => {
                                        if (!n.isRead) markAsRead(n.id);
                                    }}
                                    className={`flex items-start gap-2.5 rounded-xl p-2.5 cursor-pointer transition-colors ${
                                        n.isRead ? 'bg-white hover:bg-surface-muted/50' : 'bg-primary-light/40 hover:bg-primary-light/60'
                                    }`}
                                >
                                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                        n.isRead ? 'bg-surface-muted text-text-secondary' : 'bg-primary text-white'
                                    }`}>
                                        <Icon name={notificationIcon(n.type)} size={14} />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                            <p className={`text-xs truncate ${n.isRead ? 'font-normal text-text-primary' : 'font-bold text-text-primary'}`}>
                                                {renderText(n.title)}
                                            </p>
                                            <span className="text-[10px] text-text-secondary shrink-0">
                                                {timeAgo(n.createdAt)}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 line-clamp-2 text-[11px] text-text-secondary leading-normal">
                                            {renderText(n.body)}
                                        </p>
                                    </div>
                                    {!n.isRead && (
                                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 self-center" />
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t border-border pt-1">
                        <button
                            type="button"
                            onClick={() => {
                                setDropdownOpen(false);
                                setModalOpen(true);
                            }}
                            className="flex w-full items-center justify-center rounded-xl py-2 text-xs font-bold text-primary hover:bg-primary-light transition-colors"
                        >
                            {tr("Xem thêm tất cả")}
                        </button>
                    </div>
                </div>
            )}

            <NotificationModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </div>
    );
}
