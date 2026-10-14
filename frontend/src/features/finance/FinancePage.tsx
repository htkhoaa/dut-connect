import {useLanguage, tr, renderText, locale} from "../../shared/lib/i18n";
import {useState} from 'react';
import {useParams,Link} from 'react-router-dom';
import {useCampaign} from '../campaigns/hooks';
import {useAuth} from '../auth/store';
import {useExpenses} from './hooks';
import type {Expense,ExpenseStatus} from './types';
import {expenseStatuses} from './presentation';
import {FinancialSummaryCard} from './FinancialSummaryCard';
import {ExpenseDetails} from './ExpenseDetails';
import {ExpenseForm} from './ExpenseForm';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {Badge} from '../../shared/components/Badge';
import {Select} from '../../shared/components/Select';
import {Pagination} from '../../shared/components/Pagination';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {EmptyState} from '../../shared/components/EmptyState';
import {errorMessage} from '../../shared/api/errors';
export function FinancePage(){
    useLanguage();const {campaignId=''}=useParams();return <CampaignFinance key={campaignId} campaignId={campaignId}/>;}
function CampaignFinance({campaignId}:{campaignId:string}){
    useLanguage();
    const campaign=useCampaign(campaignId);const user=useAuth(s=>s.user);
    const [page,setPage]=useState(0);const [status,setStatus]=useState<ExpenseStatus|''>('');const [editing,setEditing]=useState<Expense|'new'|null>(null);const [saved,setSaved]=useState(false);
    const list=useExpenses(campaignId,status,page);
    if(campaign.isPending)return <LoadingState/>;if(campaign.isError)return <ErrorState message={errorMessage(campaign.error)} onRetry={()=>void campaign.refetch()}/>;
    const c=campaign.data;if(!c.ownRole&&user?.role!=='ADMIN')return <ErrorState message={tr("Bạn cần quyền quản lý chiến dịch.")}/>;
    return <div className="space-y-6"><Link className="ui-button ui-button-secondary" to={'/manage/campaigns/'+campaignId}>{tr("Không gian chiến dịch")}</Link><h1 className="break-words text-3xl font-semibold">{tr("Tài chính ·")}{renderText(c.content.title)}</h1><FinancialSummaryCard campaignId={campaignId}/>
        {renderText(c.canManage&&<Button disabled={editing!==null} onClick={()=>{setEditing('new');setSaved(false);}}>{tr("Gửi chi phí")}</Button>)}{renderText(!c.canManage&&<p className="text-text-secondary">{tr("Chiến dịch hiện chỉ cho phép xem. Quản trị viên có thể tiếp tục xét duyệt các chi phí đã gửi.")}</p>)}
        {renderText(editing&&c.canManage&&<Card><ExpenseForm key={editing==='new'?'new':editing.id} campaignId={campaignId} expense={editing==='new'?undefined:editing} onCancel={()=>setEditing(null)} onSaved={()=>{setEditing(null);setSaved(true);}}/></Card>)}{renderText(saved&&<p role="status" className="text-success">{tr("Đã gửi chi phí để quản trị viên xét duyệt.")}</p>)}
        <Card><h2 className="mb-4 text-xl font-semibold">{tr("Chi phí")}</h2><Select aria-label={tr("Trạng thái chi phí")} value={status} onChange={e=>{setStatus(e.target.value as ExpenseStatus|'');setPage(0);}}><option value="">{tr("Tất cả trạng thái")}</option>{renderText(Object.entries(expenseStatuses).map(([key,p])=><option key={key} value={key}>{renderText(p.label)}</option>))}</Select>
            {renderText(list.isPending?<LoadingState/>:list.isError?<ErrorState message={errorMessage(list.error)} onRetry={()=>void list.refetch()}/>:<>{!list.data.items.length?<EmptyState message={tr("Chưa có chi phí.")}/>:<div className="divide-y divide-border">{renderText(list.data.items.map(e=><div key={e.id} className="space-y-3 py-5"><Badge tone={expenseStatuses[e.status].tone}>{renderText(expenseStatuses[e.status].label)}</Badge><ExpenseDetails expense={e}/><p className="text-sm text-text-secondary">{tr("Người gửi")}{renderText(e.submittedByName)}{renderText(e.reviewedByName&&<>{tr("· Duyệt bởi")}{e.reviewedByName}{tr("lúc")}{new Date(e.reviewedAt!).toLocaleString(locale())}</>)}</p>{renderText(e.rejectionReason&&<p className="break-words text-danger">{tr("Lý do từ chối:")}{renderText(e.rejectionReason)}</p>)}{renderText(e.canEdit&&c.canManage&&<Button disabled={editing!==null} onClick={()=>{setEditing(e);setSaved(false);}}>{tr("Chỉnh sửa chi phí chờ duyệt")}</Button>)}</div>))}</div>}<Pagination {...list.data} onPageChange={setPage}/></>)}
        </Card></div>;
}
