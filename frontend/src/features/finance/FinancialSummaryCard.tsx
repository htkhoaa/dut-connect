import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useFinancialSummary} from './hooks';
import {vnd} from '../campaigns/presentation';
import {Button} from '../../shared/components/Button';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';
import {Icon} from '../../shared/components/Icon';

export function FinancialSummaryCard({campaignId}: {campaignId: string}) {
    useLanguage();
    const query = useFinancialSummary(campaignId);

    if (query.isPending) return <div className="rounded-2xl border border-border bg-white p-6 shadow-xs"><LoadingState /></div>;
    if (query.isError) return <div className="rounded-2xl border border-border bg-white p-6 shadow-xs"><ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} /></div>;

    const d = query.data;
    const hasFinancialData = BigInt(d.fundraisingGoal ?? 0) > 0n || BigInt(d.verifiedDonations ?? 0) > 0n || d.successfulDonationCount > 0;
    if (!hasFinancialData) return null;

    const raisedBig = BigInt(d.verifiedDonations ?? 0);
    const goalBig = BigInt(d.fundraisingGoal ?? 0);
    const percent = goalBig > 0n ? Math.min(100, Number((raisedBig * 100n) / goalBig)) : 0;

    return (
        <div className="relative overflow-hidden rounded-3xl border border-primary-muted/60 bg-linear-to-br from-primary-light/40 via-white to-sky-50/50 p-6 sm:p-7 shadow-xs">
            {/* Top row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-2xs">
                        <Icon name="heart" size={17} />
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
                <Button
                    variant="secondary"
                    className="text-xs py-1.5 px-3 rounded-xl"
                    disabled={query.isFetching}
                    onClick={() => void query.refetch()}
                >
                    {query.isFetching ? tr("Đang tải…") : tr("Làm mới số liệu")}
                </Button>
            </div>

            {/* Raised Amount & Target Highlight */}
            <div className="my-5 flex flex-wrap items-baseline justify-between gap-3">
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
                        {renderText(vnd(d.verifiedDonations))}
                    </span>
                    {goalBig > 0n && (
                        <span className="text-base sm:text-lg font-medium text-text-secondary">
                            / {renderText(vnd(d.fundraisingGoal))}
                        </span>
                    )}
                </div>
                {goalBig > 0n && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {percent}% {tr("mục tiêu")}
                    </span>
                )}
            </div>

            {/* Progress Bar */}
            {goalBig > 0n && (
                <div className="mb-6">
                    <div className="h-3 w-full overflow-hidden rounded-full bg-border/60">
                        <div
                            className="h-full rounded-full bg-linear-to-r from-primary to-sky-500 transition-all duration-500"
                            style={{width: `${percent}%`}}
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
