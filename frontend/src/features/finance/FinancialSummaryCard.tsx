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
    return <Card><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{tr("Tài chính chiến dịch")}</h2><Button disabled={query.isFetching} onClick={()=>void query.refetch()}>{tr("Làm mới số liệu")}</Button></div>
        {renderText(query.isPending?<LoadingState/>:query.isError?<ErrorState message={errorMessage(query.error)} onRetry={()=>void query.refetch()}/>:<div className="space-y-5"><Fundraising raised={query.data.verifiedDonations} goal={query.data.fundraisingGoal}/><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{renderText(([
            [tr("Kinh phí nhà trường"),query.data.institutionalFunding],[tr("Kinh phí tài trợ"),query.data.sponsorFunding],[tr("Tổng kinh phí"),query.data.totalFunding],[tr("Chi phí đã duyệt"),query.data.approvedExpenses],[tr("Kinh phí còn lại"),query.data.remainingFunds]
        ] as const).map(([label,value])=><div key={label}><dt className="text-text-secondary">{renderText(label)}</dt><dd className={`break-words text-lg font-semibold ${BigInt(value)<0n?'text-danger':''}`}>{renderText(vnd(value))}</dd></div>))}<div><dt className="text-text-secondary">{tr("Lượt đóng góp thành công")}</dt><dd className="text-lg font-semibold">{renderText(query.data.successfulDonationCount)}</dd></div></dl><p className="text-sm text-text-secondary">{tr("Chỉ khoản đóng góp đã xác nhận thanh toán và chi phí đã duyệt được tính vào tổng.")}</p></div>)}
    </Card>;
}
