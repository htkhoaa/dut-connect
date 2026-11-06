import {useQuery} from '@tanstack/react-query';
import {useLanguage, tr, renderText} from '../../shared/lib/i18n';
import {apiClient} from '../../shared/api/client';
import {Icon} from '../../shared/components/Icon';

interface ActivityItem {
    id: string;
    type: 'DONATION' | 'VOLUNTEER' | 'MILESTONE';
    title: string;
    description: string;
    amount?: number;
    timestamp: string;
}

function timeAgo(dateStr: string) {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return tr("Vừa xong");
    if (diff < 3600) return `${Math.floor(diff / 60)} ${tr("phút trước")}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${tr("giờ trước")}`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
}

export function CampaignActivityFeed({campaignId}: {campaignId: string}) {
    useLanguage();
    const query = useQuery({
        queryKey: ['campaign-activities', campaignId],
        queryFn: async () => {
            return (await apiClient.get<ActivityItem[]>(`/campaigns/${campaignId}/activities`)).data;
        },
        refetchInterval: 12_000, // Poll every 12s
    });

    const items = query.data ?? [];

    return (
        <div className="rounded-2xl border border-border bg-white p-5 shadow-xs">
            {/* Header with live pulse */}
            <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    </span>
                    <h3 className="text-sm font-bold text-text-primary">{tr("Nhịp đập chiến dịch")}</h3>
                </div>
            </div>

            {/* Activities list */}
            {items.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-text-secondary">
                        <Icon name="spark" size={18} />
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                        {tr("Chưa có lượt tương tác nào.")}<br/>
                        <span className="text-primary font-medium">{tr("Hãy là người đầu tiên tiếp sức cho chiến dịch này!")}</span>
                    </p>
                </div>
            ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1 divide-y divide-border/30">
                    {items.map(item => (
                        <div key={item.id} className="pt-2.5 first:pt-0 flex items-start gap-3">
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                                item.type === 'DONATION'
                                    ? 'bg-rose-50 text-rose-600'
                                    : 'bg-primary-light text-primary'
                            }`}>
                                <Icon name={item.type === 'DONATION' ? 'heart' : 'users'} size={14} />
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between gap-1">
                                    <p className="text-xs font-semibold text-text-primary truncate">
                                        {renderText(item.title)}
                                    </p>
                                    <span className="text-[10px] text-text-secondary shrink-0">
                                        {timeAgo(item.timestamp)}
                                    </span>
                                </div>
                                <p className="text-[11px] text-text-secondary mt-0.5">
                                    {renderText(item.description)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
