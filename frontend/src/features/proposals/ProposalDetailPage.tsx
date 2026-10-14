import {useLanguage, tr, renderText, locale} from "../../shared/lib/i18n";
import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useParams,useNavigate,Link} from 'react-router-dom';
import {useProposal,useReviewProposal} from './hooks';
import {useAuth} from '../auth/store';
import {proposalStatuses} from '../campaigns/presentation';
import {PlanContent} from '../campaigns/components/PlanContent';
import {PlanForm} from '../campaigns/components/PlanForm';
import type {ReviewAction} from '../campaigns/types';
import {errorMessage} from '../../shared/api/errors';
import {Card} from '../../shared/components/Card';
import {Badge} from '../../shared/components/Badge';
import {Button} from '../../shared/components/Button';
import {Textarea} from '../../shared/components/Textarea';
import {FormField} from '../../shared/components/FormField';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
export function ProposalDetailPage(){
    useLanguage();
    const {id=''}=useParams();
    return <ProposalDetail key={id} id={id}/>;
}
function ProposalDetail({id}:{id:string}){
    useLanguage();
    const query=useProposal(id);const review=useReviewProposal(id);const user=useAuth(s=>s.user);const navigate=useNavigate();
    const [action,setAction]=useState<ReviewAction|null>(null);const reason=useForm<{reason:string}>({defaultValues:{reason:''}});
    if(query.isPending)return <LoadingState/>;if(query.isError)return <ErrorState message={errorMessage(query.error)} onRetry={()=>void query.refetch()}/>;
    const p=query.data;
    return <div className="space-y-6"><Link className="text-primary hover:underline" to={user?.role==='ADMIN'?'/admin/proposals':'/proposals'}>{tr("Về danh sách đề xuất")}</Link><div className="flex flex-wrap gap-3"><h1 className="max-w-full break-words text-3xl font-semibold">{renderText(p.content.title)}</h1><Badge tone={proposalStatuses[p.status].tone}>{renderText(proposalStatuses[p.status].label)}</Badge></div>
        <Card><p className="mb-4 text-text-secondary">{tr("Người đề xuất")}{renderText(p.proposerName)} · {renderText(new Date(p.createdAt).toLocaleDateString(locale()))}</p><PlanContent content={p.content} organizerName={p.organizationName||p.proposerName} categoryName={p.categoryName}/>{renderText(p.rejectionReason&&<p role="status" className="mt-5 whitespace-pre-wrap text-danger">{tr("Lý do từ chối:")}{renderText(p.rejectionReason)}</p>)}{renderText(p.reviewedAt&&<p className="mt-4 text-sm text-text-secondary">{tr("Xét duyệt")}{renderText(new Date(p.reviewedAt).toLocaleString(locale()))}</p>)}{renderText(p.campaignId&&<Link className="mt-4 inline-block text-primary hover:underline" to={'/campaigns/'+p.campaignId}>{tr("Xem chiến dịch")}</Link>)}</Card>
        {renderText(p.canEdit&&<Card><h2 className="mb-5 text-xl font-semibold">{tr("Chỉnh sửa đề xuất chờ duyệt")}</h2><PlanForm key={p.id} id={p.id} content={p.content} version={p.version} categoryName={p.categoryName} organizationName={p.organizationName||undefined}/></Card>)}
        {renderText(user?.role==='ADMIN'&&p.status==='PENDING'&&<Card><h2 className="mb-4 text-xl font-semibold">{tr("Duyệt đề xuất")}</h2><Button disabled={review.isPending} onClick={()=>setAction({command:'approve',version:p.version})}>{tr("Duyệt đề xuất")}</Button><form className="mt-5 space-y-3" onSubmit={reason.handleSubmit(v=>{const parsed=z.string().trim().min(1,tr("Nhập lý do từ chối")).max(1000).safeParse(v.reason);if(parsed.success)setAction({command:'reject',reason:parsed.data,version:p.version});else reason.setError('reason',{message:parsed.error.issues[0].message});})}><FormField id="rejection-reason" label={tr("Lý do từ chối")} error={reason.formState.errors.reason?.message}><Textarea id="rejection-reason" maxLength={1000} disabled={review.isPending} {...reason.register('reason')}/></FormField><Button type="submit" disabled={review.isPending}>{tr("Từ chối đề xuất")}</Button></form></Card>)}
        {renderText(review.isError&&<ErrorState message={errorMessage(review.error)}/>)}
        {renderText(review.isSuccess&&<p role="status" className="text-success">{tr("Đã xét duyệt đề xuất.")}</p>)}
        <ConfirmDialog open={action!==null} title={action?.command==='approve'?tr("Duyệt đề xuất?"):tr("Từ chối đề xuất?")} message={action?.command==='approve'?tr("Tạo một chiến dịch nháp và gán người đề xuất làm chủ sở hữu."):tr("Lý do sẽ được lưu và đề xuất không thể chỉnh sửa tiếp.")} busy={review.isPending} confirmLabel={tr("Xác nhận")} onClose={()=>setAction(null)} onConfirm={()=>{if(action)review.mutate(action,{onSuccess:result=>{if(action.command==='approve')navigate('/manage/campaigns/'+result.id);},onSettled:()=>setAction(null)});}}/>
    </div>;
}
