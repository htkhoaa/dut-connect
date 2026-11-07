import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useState, useEffect} from 'react';
import {useFinancialSummary} from './hooks';
import {vnd} from '../campaigns/presentation';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';

export function FinancialSummaryCard({campaignId}: {campaignId: string}) {
    useLanguage();
    const query = useFinancialSummary(campaignId);
    const [recentDonationNotice, setRecentDonationNotice] = useState<string | null>(null);

    // Realtime WebSocket update for Financial Stats
    useEffect(() => {
        const handler = (e: Event) => {
            const event = e as CustomEvent;
            const data = event.detail;
            if (!data) return;
            if (!data.campaignId || data.campaignId === campaignId) {
                void query.refetch();
                if (data.amount) {
                    const donor = data.donorName || 'Một tấm lòng hảo tâm';
                    setRecentDonationNotice(`+${Number(data.amount).toLocaleString('vi-VN')} đ từ ${donor}`);
                    setTimeout(() => setRecentDonationNotice(null), 6000);
                }
            }
        };

        window.addEventListener('app:donation_received', handler);
        return () => window.removeEventListener('app:donation_received', handler);
    }, [campaignId, query]);

    if (query.isPending) return <div className="rounded-2xl border border-border bg-white p-6 shadow-xs"><LoadingState /></div>;
    if (query.isError) return <div className="rounded-2xl border border-border bg-white p-6 shadow-xs"><ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} /></div>;

    const d = query.data;
    const hasFinancialData = BigInt(d.fundraisingGoal ?? 0) > 0n || BigInt(d.verifiedDonations ?? 0) > 0n || d.successfulDonationCount > 0;
    if (!hasFinancialData) return null;

    const raisedNum = Number(d.verifiedDonations ?? 0);
    const goalNum = Number(d.fundraisingGoal ?? 0);
    const percentRaw = goalNum > 0 ? (raisedNum / goalNum) * 100 : 0;
    const percentDisplay = percentRaw >= 100
        ? '100%'
        : percentRaw >= 1
            ? `${Math.round(percentRaw)}%`
            : percentRaw > 0
                ? `${percentRaw.toFixed(1)}%`
                : '0%';
    const barWidthPercent = percentRaw > 0 ? Math.max(1.5, Math.min(100, percentRaw)) : 0;

    return (
        <div className="relative overflow-hidden rounded-3xl border border-primary-muted/60 bg-linear-to-br from-primary-light/40 via-white to-sky-50/50 p-6 sm:p-7 shadow-xs">
            {/* Top row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-2xs font-bold text-sm">
                        ₫
                    </span>
                    <div>
                        <h2 className="text-base font-bold text-text-primary tracking-tight">
                            {tr("Tiếp sức gây quỹ chiến dịch")}
                        </h2>
                        <p className="text-xs text-text-secondary">
                            {tr("Đóng góp trực tiếp minh bạch từ cộng đồng")}
                        </p>
                    </div>
                </div>
            </div>

            {recentDonationNotice && (
                <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-emerald-300 bg-emerald-100/80 px-4 py-2 text-xs font-bold text-emerald-900 shadow-sm animate-fade-in">
                    <div className="flex items-center gap-2">
                        <span className="text-base">✓</span>
                        <span>{tr("Giao dịch mới vừa được ghi nhận:")} <span className="text-emerald-700 font-extrabold">{recentDonationNotice}</span></span>
                    </div>
                    <span className="text-[10px] text-emerald-600 uppercase tracking-wider">{tr("Realtime")}</span>
                </div>
            )}

            {/* Raised Amount & Target Highlight */}
            <div className="my-5 flex flex-wrap items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                        {renderText(vnd(d.verifiedDonations))}
                    </span>
                    {goalNum > 0 && (
                        <span className="text-base sm:text-lg font-medium text-text-secondary">
                            / {renderText(vnd(d.fundraisingGoal))}
                        </span>
                    )}
                </div>
                {goalNum > 0 && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {percentDisplay} {tr("mục tiêu")}
                    </span>
                )}
            </div>

            {/* Progress Bar */}
            {goalNum > 0 && (
                <div className="mb-6">
                    <div className="h-3 w-full overflow-hidden rounded-full bg-border/60">
                        <div
                            className="h-full rounded-full bg-linear-to-r from-primary to-sky-500 transition-all duration-700 ease-out"
                            style={{width: `${barWidthPercent}%`}}
                        />
                    </div>
                </div>
            )}

            {/* Quick Stat Pill Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-border/50">
                <div className="rounded-2xl bg-white/80 border border-border/60 p-3 shadow-2xs">
                    <p className="text-[11px] font-semibold text-text-secondary">{tr("Đã quyên góp")}</p>
                    <p className="text-base font-bold text-primary mt-0.5 truncate">{renderText(vnd(d.verifiedDonations))}</p>
                </div>
                <div className="rounded-2xl bg-white/80 border border-border/60 p-3 shadow-2xs">
                    <p className="text-[11px] font-semibold text-text-secondary">{tr("Mục tiêu chiến dịch")}</p>
                    <p className="text-base font-bold text-text-primary mt-0.5 truncate">{renderText(vnd(d.fundraisingGoal))}</p>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-2xl bg-white/80 border border-border/60 p-3 shadow-2xs">
                    <p className="text-[11px] font-semibold text-text-secondary">{tr("Lượt tiếp sức thành công")}</p>
                    <p className="text-base font-bold text-emerald-600 mt-0.5">{renderText(d.successfulDonationCount)} {tr("lượt")}</p>
                </div>
            </div>
        </div>
    );
}
