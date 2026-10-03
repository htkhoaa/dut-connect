import {useState} from 'react';
import {useIsMutating} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {useExpenses,useReviewExpense} from './hooks';
import type {Expense,ExpenseStatus} from './types';
import {expenseStatuses} from './presentation';
import {ExpenseDetails} from './ExpenseDetails';
import {ExpenseRejectionForm} from './ExpenseRejectionForm';
import {Button} from '../../shared/components/Button';
import {Card} from '../../shared/components/Card';
import {Badge} from '../../shared/components/Badge';
import {Select} from '../../shared/components/Select';
import {Pagination} from '../../shared/components/Pagination';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {LoadingState} from '../../shared/components/LoadingState';
import {EmptyState} from '../../shared/components/EmptyState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';

export function AdminExpensesPage(){
    const [status,setStatus]=useState<ExpenseStatus>('PENDING');
    const [page,setPage]=useState(0);
    const [rejecting,setRejecting]=useState<Expense|null>(null);
    const [approving,setApproving]=useState<Expense|null>(null);
    const [feedback,setFeedback]=useState('');
    const list=useExpenses(undefined,status,page);
    const review=useReviewExpense();
    const busy=useIsMutating({mutationKey:['finance','review']})>0;
    const saved=()=>{setApproving(null);setRejecting(null);setFeedback('Đã lưu quyết định duyệt chi phí.');};
    return <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Duyệt chi phí</h1>
        <div className="flex flex-wrap gap-3">
            <Select disabled={busy} className="sm:max-w-xs" aria-label="Trạng thái chi phí" value={status} onChange={e=>{
                setStatus(e.target.value as ExpenseStatus);setPage(0);setRejecting(null);setFeedback('');review.reset();
            }}>{Object.entries(expenseStatuses).map(([key,p])=><option key={key} value={key}>{p.label}</option>)}</Select>
            <Button disabled={busy||list.isFetching} onClick={()=>void list.refetch()}>Làm mới chi phí</Button>
        </div>
        {review.isError&&<ErrorState message={errorMessage(review.error)}/>}
        {feedback&&<p className="text-success" role="status">{feedback}</p>}
        {list.isPending?<LoadingState/>:list.isError?<ErrorState message={errorMessage(list.error)} onRetry={()=>void list.refetch()}/>:<>
            {!list.data.items.length?<EmptyState message="Không có chi phí ở trạng thái này."/>:<div className="space-y-4">{list.data.items.map(e=><Card key={e.id}>
                <div className="space-y-3">
                    <Badge tone={expenseStatuses[e.status].tone}>{expenseStatuses[e.status].label}</Badge>
                    <Link className="block break-words text-primary hover:underline" to={'/manage/campaigns/'+e.campaignId+'/finance'}>{e.campaignTitle}</Link>
                    <ExpenseDetails expense={e}/>
                    <p className="text-sm text-text-secondary">Người gửi {e.submittedByName}</p>
                    {e.reviewedByName&&<p>Người xét duyệt {e.reviewedByName} lúc {new Date(e.reviewedAt!).toLocaleString('vi-VN')}</p>}
                    {e.rejectionReason&&<p className="break-words text-danger">Lý do từ chối: {e.rejectionReason}</p>}
                    {e.status==='PENDING'&&<div className="flex flex-wrap gap-3">
                        <Button disabled={busy||rejecting!==null} onClick={()=>{review.reset();setFeedback('');setApproving(e);}}>Duyệt</Button>
                        <Button disabled={busy||rejecting!==null} onClick={()=>{review.reset();setFeedback('');setRejecting(e);}}>Từ chối</Button>
                    </div>}
                    {rejecting?.id===e.id&&<ExpenseRejectionForm key={e.id} expense={rejecting} onSaved={saved} onCancel={()=>setRejecting(null)}/>}
                </div>
            </Card>)}</div>}
            <Pagination {...list.data} hasNext={!busy&&list.data.hasNext} hasPrevious={!busy&&list.data.hasPrevious} onPageChange={value=>{setPage(value);setRejecting(null);}}/>
        </>}
        <ConfirmDialog open={approving!==null} title="Duyệt chi phí?" message="Duyệt chi phí là quyết định cuối cùng. Khoản chi sẽ được tính vào tổng tài chính công khai." confirmLabel="Xác nhận xét duyệt" busy={review.isPending} onClose={()=>setApproving(null)} onConfirm={()=>{
            if(approving)review.mutate({id:approving.id,version:approving.version,command:'approve'},{onSuccess:saved,onError:()=>setApproving(null)});
        }}/>
    </div>;
}
