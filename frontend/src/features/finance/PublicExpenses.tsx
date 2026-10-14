import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useState} from 'react';
import {useApprovedExpenses} from './hooks';
import {ExpenseDetails} from './ExpenseDetails';
import {Card} from '../../shared/components/Card';
import {Pagination} from '../../shared/components/Pagination';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {EmptyState} from '../../shared/components/EmptyState';
import {errorMessage} from '../../shared/api/errors';
export function PublicExpenses({campaignId}:{campaignId:string}){
    useLanguage();
    const [page,setPage]=useState(0);const query=useApprovedExpenses(campaignId,page);
    return <Card><h2 className="mb-4 text-xl font-semibold">{tr("Chi phí đã duyệt")}</h2>{renderText(query.isPending?<LoadingState/>:query.isError?<ErrorState message={errorMessage(query.error)} onRetry={()=>void query.refetch()}/>:<>{query.data.items.length?<div className="divide-y divide-border">{renderText(query.data.items.map(e=><div className="py-4" key={e.id}><ExpenseDetails expense={e}/></div>))}</div>:<EmptyState message={tr("Chưa có chi phí được duyệt.")}/>}<Pagination {...query.data} onPageChange={setPage}/></>)}</Card>;
}
