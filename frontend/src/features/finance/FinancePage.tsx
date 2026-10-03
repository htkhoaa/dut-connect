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
export function FinancePage(){const {campaignId=''}=useParams();return <CampaignFinance key={campaignId} campaignId={campaignId}/>;}
function CampaignFinance({campaignId}:{campaignId:string}){
    const campaign=useCampaign(campaignId);const user=useAuth(s=>s.user);
    const [page,setPage]=useState(0);const [status,setStatus]=useState<ExpenseStatus|''>('');const [editing,setEditing]=useState<Expense|'new'|null>(null);const [saved,setSaved]=useState(false);
    const list=useExpenses(campaignId,status,page);
    if(campaign.isPending)return <LoadingState/>;if(campaign.isError)return <ErrorState message={errorMessage(campaign.error)} onRetry={()=>void campaign.refetch()}/>;
    const c=campaign.data;if(!c.ownRole&&user?.role!=='ADMIN')return <ErrorState message="Bạn cần quyền quản lý chiến dịch."/>;
    return <div className="space-y-6"><Link className="text-primary hover:underline" to={'/manage/campaigns/'+campaignId}>Không gian chiến dịch</Link><h1 className="break-words text-3xl font-semibold">Tài chính · {c.content.title}</h1><FinancialSummaryCard campaignId={campaignId}/>
        {c.canManage&&<Button disabled={editing!==null} onClick={()=>{setEditing('new');setSaved(false);}}>Gửi chi phí</Button>}{!c.canManage&&<p className="text-text-secondary">Chiến dịch hiện chỉ cho phép xem. Quản trị viên có thể tiếp tục xét duyệt các chi phí đã gửi.</p>}
        {editing&&c.canManage&&<Card><ExpenseForm key={editing==='new'?'new':editing.id} campaignId={campaignId} expense={editing==='new'?undefined:editing} onCancel={()=>setEditing(null)} onSaved={()=>{setEditing(null);setSaved(true);}}/></Card>}{saved&&<p role="status" className="text-success">Đã gửi chi phí để quản trị viên xét duyệt.</p>}
        <Card><h2 className="mb-4 text-xl font-semibold">Chi phí</h2><Select aria-label="Trạng thái chi phí" value={status} onChange={e=>{setStatus(e.target.value as ExpenseStatus|'');setPage(0);}}><option value="">Tất cả trạng thái</option>{Object.entries(expenseStatuses).map(([key,p])=><option key={key} value={key}>{p.label}</option>)}</Select>
            {list.isPending?<LoadingState/>:list.isError?<ErrorState message={errorMessage(list.error)} onRetry={()=>void list.refetch()}/>:<>{!list.data.items.length?<EmptyState message="Chưa có chi phí."/>:<div className="divide-y divide-border">{list.data.items.map(e=><div key={e.id} className="space-y-3 py-5"><Badge tone={expenseStatuses[e.status].tone}>{expenseStatuses[e.status].label}</Badge><ExpenseDetails expense={e}/><p className="text-sm text-text-secondary">Người gửi {e.submittedByName}{e.reviewedByName&&<> · Duyệt bởi {e.reviewedByName} lúc {new Date(e.reviewedAt!).toLocaleString('vi-VN')}</>}</p>{e.rejectionReason&&<p className="break-words text-danger">Lý do từ chối: {e.rejectionReason}</p>}{e.canEdit&&c.canManage&&<Button disabled={editing!==null} onClick={()=>{setEditing(e);setSaved(false);}}>Chỉnh sửa chi phí chờ duyệt</Button>}</div>)}</div>}<Pagination {...list.data} onPageChange={setPage}/></>}
        </Card></div>;
}
