import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useFinancialSummary} from './hooks';
import {Fundraising} from './Fundraising';
import {vnd} from '../campaigns/presentation';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';
export function FinancialSummaryCard({campaignId}:{campaignId:string}){
    useLanguage();
    const query=useFinancialSummary(campaignId);
    if (query.isPending) return <Card><LoadingState/></Card>;
    if (query.isError) return <Card><ErrorState message={errorMessage(query.error)} onRetry={()=>void query.refetch()}/></Card>;
    const d = query.data;
    // Only show if campaign has donation activity or a fundraising goal
    const hasFinancialData = BigInt(d.fundraisingGoal ?? 0) > 0n || BigInt(d.verifiedDonations ?? 0) > 0n || d.successfulDonationCount > 0;
    if (!hasFinancialData) return null;
    return <Card><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{tr("Tài chính chiến dịch")}</h2><Button disabled={query.isFetching} onClick={()=>void query.refetch()}>{tr("Làm mới số liệu")}</Button></div>
        <div className="space-y-5"><Fundraising raised={d.verifiedDonations} goal={d.fundraisingGoal}/><dl className="grid gap-4 sm:grid-cols-3"><div><dt className="text-text-secondary">{tr("Đã quyên góp")}</dt><dd className={`break-words text-lg font-semibold ${BigInt(d.verifiedDonations)<0n?'text-danger':'text-primary'}`}>{renderText(vnd(d.verifiedDonations))}</dd></div><div><dt className="text-text-secondary">{tr("Mục tiêu")}</dt><dd className="break-words text-lg font-semibold">{renderText(vnd(d.fundraisingGoal))}</dd></div><div><dt className="text-text-secondary">{tr("Lượt đóng góp thành công")}</dt><dd className="text-lg font-semibold">{renderText(d.successfulDonationCount)}</dd></div></dl><p className="text-sm text-text-secondary">{tr("Chỉ khoản đóng góp đã xác nhận thanh toán được tính vào tổng.")}</p></div>
    </Card>;
}
