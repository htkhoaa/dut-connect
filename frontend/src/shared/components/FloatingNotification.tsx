import {useState, useEffect} from 'react';
import {useLanguage, tr, renderText} from '../lib/i18n';

export interface BannerItem {
    id: string;
    type: 'donation' | 'notification' | 'info';
    title: string;
    message: string;
    actionUrl?: string;
}

export function FloatingNotificationContainer() {
    useLanguage();
    const [banners, setBanners] = useState<BannerItem[]>([]);

    const remove = (id: string) => {
        setBanners((prev) => prev.filter((b) => b.id !== id));
    };

    useEffect(() => {
        // 1. Listen for donation WebSocket events
        const handleDonation = (e: Event) => {
            const event = e as CustomEvent;
            const data = event.detail;
            if (!data) return;

            const id = 'don-' + (data.donationId || Date.now());
            const donor = data.donorName || tr("Một nhà hảo tâm");
            const formatted = data.amount ? Number(data.amount).toLocaleString('vi-VN') + ' đ' : '';
            const campaign = data.campaignTitle || tr("chiến dịch");

            const newBanner: BannerItem = {
                id,
                type: 'donation',
                title: tr("Tiếp sức chiến dịch thành công! 🎉"),
                message: `${donor} ${tr("vừa đóng góp")} ${formatted} ${tr("cho")} "${campaign}".`,
                actionUrl: data.campaignId ? `/campaigns/${data.campaignId}` : undefined,
            };

            setBanners((prev) => {
                if (prev.some((b) => b.id === id)) return prev;
                return [newBanner, ...prev.slice(0, 3)];
            });

            // Auto-dismiss after 8 seconds
            setTimeout(() => {
                setBanners((prev) => prev.filter((b) => b.id !== id));
            }, 8000);
        };

        // 2. Listen for general notification WebSocket events
        const handleNotification = (e: Event) => {
            const event = e as CustomEvent;
            const data = event.detail;
            if (!data) return;

            const notif = data.notification || data;
            const id = 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
            const newBanner: BannerItem = {
                id,
                type: 'notification',
                title: notif.title || tr("Thông báo mới 🔔"),
                message: notif.body || notif.content || notif.message || '',
            };

            setBanners((prev) => [newBanner, ...prev.slice(0, 3)]);

            setTimeout(() => {
                setBanners((prev) => prev.filter((b) => b.id !== id));
            }, 8000);
        };

        // 3. Custom trigger for any UI component
        const handleCustom = (e: Event) => {
            const event = e as CustomEvent<BannerItem>;
            if (!event.detail) return;
            const id = event.detail.id || 'custom-' + Date.now();
            setBanners((prev) => [{...event.detail, id}, ...prev.slice(0, 3)]);
            setTimeout(() => {
                setBanners((prev) => prev.filter((b) => b.id !== id));
            }, 8000);
        };

        window.addEventListener('app:donation_received', handleDonation);
        window.addEventListener('app:new_notification', handleNotification);
        window.addEventListener('app:show_banner', handleCustom);

        return () => {
            window.removeEventListener('app:donation_received', handleDonation);
            window.removeEventListener('app:new_notification', handleNotification);
            window.removeEventListener('app:show_banner', handleCustom);
        };
    }, []);

    if (banners.length === 0) return null;

    return (
        <aside
            aria-label={tr("Thông báo hệ thống")}
            className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
        >
            {banners.map((item) => (
                <div
                    key={item.id}
                    className="pointer-events-auto relative overflow-hidden rounded-2xl border border-primary/25 bg-white/95 p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-3 hover:shadow-2xl hover:border-primary/40"
                >
                    {/* Top gradient highlight strip */}
                    <div
                        className={`absolute top-0 left-0 right-0 h-1 ${
                            item.type === 'donation'
                                ? 'bg-linear-to-r from-emerald-400 via-primary to-sky-400'
                                : 'bg-linear-to-r from-primary to-amber-400'
                        }`}
                    />

                    <div className="flex items-start gap-3">
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                item.type === 'donation'
                                    ? 'bg-emerald-100 text-emerald-700 font-extrabold text-sm'
                                    : 'bg-primary-light text-primary font-bold text-sm'
                            }`}
                        >
                            {item.type === 'donation' ? '₫' : '🔔'}
                        </div>

                        <div className="flex-1 min-w-0 pr-4">
                            <h4 className="text-xs font-bold text-text-primary tracking-tight">
                                {renderText(item.title)}
                            </h4>
                            <p className="mt-1 text-xs text-text-secondary leading-relaxed line-clamp-3">
                                {renderText(item.message)}
                            </p>
                            <span className="mt-1.5 block text-[10px] font-medium text-text-muted">
                                {tr("Vừa xong · Realtime")}
                            </span>
                        </div>

                        {/* Close button with clear hit area */}
                        <button
                            type="button"
                            onClick={() => remove(item.id)}
                            className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text-primary transition-colors text-xs font-bold"
                            title={tr("Đóng thông báo")}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </aside>
    );
}
