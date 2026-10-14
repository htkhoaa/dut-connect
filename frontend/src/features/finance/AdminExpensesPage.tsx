import {useLanguage, tr, renderText, locale} from "../../shared/lib/i18n";
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
    useLanguage();
    const [status,setStatus]=useState<ExpenseStatus>('PENDING');
    const [page,setPage]=useState(0);
    const [rejecting,setRejecting]=useState<Expense|null>(null);
    const [approving,setApproving]=useState<Expense|null>(null);
    const [feedback,setFeedback]=useState('');
    const list=useExpenses(undefined,status,page);
    const review=useReviewExpense();
    const busy=useIsMutating({mutationKey:['finance','review']})>0;
    const saved=()=>{setApproving(null);setRejecting(null);setFeedback(tr("Đã lưu quyết định duyệt chi phí."));};
    return <div className="space-y-6">
        <h1 className="text-3xl font-semibold">{tr("Duyệt chi phí")}</h1>
        <div className="flex flex-wrap gap-3">
            <Select disabled={busy} className="sm:max-w-xs" aria-label={tr("Trạng thái chi phí")} value={status} onChange={e=>{
                setStatus(e.target.value as ExpenseStatus);setPage(0);setRejecting(null);setFeedback('');review.reset();
            }}>{renderText(Object.entries(expenseStatuses).map(([key,p])=><option key={key} value={key}>{renderText(p.label)}</option>))}</Select>
            <Button disabled={busy||list.isFetching} onClick={()=>void list.refetch()}>{tr("Làm mới chi phí")}</Button>
        </div>
        {renderText(review.isError&&<ErrorState message={errorMessage(review.error)}/>)}
        {renderText(feedback&&<p className="text-success" role="status">{renderText(feedback)}</p>)}
        {renderText(list.isPending?<LoadingState/>:list.isError?<ErrorState message={errorMessage(list.error)} onRetry={()=>void list.refetch()}/>:<>
            {!list.data.items.length?<EmptyState message={tr("Không có chi phí ở trạng thái này.")}/>:<div className="space-y-4">{renderText(list.data.items.map(e=><Card key={e.id}>
                <div className="space-y-3">
                    <Badge tone={expenseStatuses[e.status].tone}>{renderText(expenseStatuses[e.status].label)}</Badge>
                    <Link className="block break-words text-primary hover:underline" to={'/manage/campaigns/'+e.campaignId+'/finance'}>{renderText(e.campaignTitle)}</Link>
                    <ExpenseDetails expense={e}/>
                    <p className="text-sm text-text-secondary">{tr("Người gửi")}{renderText(e.submittedByName)}</p>
                    {renderText(e.reviewedByName&&<p>{tr("Người xét duyệt")}{renderText(e.reviewedByName)}{tr("lúc")}{renderText(new Date(e.reviewedAt!).toLocaleString(locale()))}</p>)}
                    {renderText(e.rejectionReason&&<p className="break-words text-danger">{tr("Lý do từ chối:")}{renderText(e.rejectionReason)}</p>)}
                    {renderText(e.status==='PENDING'&&<div className="flex flex-wrap gap-3">
                        <Button disabled={busy||rejecting!==null} onClick={()=>{review.reset();setFeedback('');setApproving(e);}}>{tr("Duyệt")}</Button>
                        <Button disabled={busy||rejecting!==null} onClick={()=>{review.reset();setFeedback('');setRejecting(e);}}>{tr("Từ chối")}</Button>
                    </div>)}
                    {renderText(rejecting?.id===e.id&&<ExpenseRejectionForm key={e.id} expense={rejecting} onSaved={saved} onCancel={()=>setRejecting(null)}/>)}
                </div>
            </Card>))}</div>}
            <Pagination {...list.data} hasNext={!busy&&list.data.hasNext} hasPrevious={!busy&&list.data.hasPrevious} onPageChange={value=>{setPage(value);setRejecting(null);}}/>
        </>)}
        <ConfirmDialog open={approving!==null} title={tr("Duyệt chi phí?")} message={tr("Duyệt chi phí là quyết định cuối cùng. Khoản chi sẽ được tính vào tổng tài chính công khai.")} confirmLabel={tr("Xác nhận xét duyệt")} busy={review.isPending} onClose={()=>setApproving(null)} onConfirm={()=>{
            if(approving)review.mutate({id:approving.id,version:approving.version,command:'approve'},{onSuccess:saved,onError:()=>setApproving(null)});
        }}/>
    </div>;
}
