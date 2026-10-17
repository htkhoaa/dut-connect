import {useLanguage, tr, renderText, locale} from "../../shared/lib/i18n";
import {useState,useEffect} from 'react';
import {Link,useParams} from 'react-router-dom';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useApplications,useChangeApplication,useRecruitmentSummary} from './hooks';
import type {ApplicationAction,ApplicationFilters,VolunteerApplication,RecruitmentSummary} from './types';
import type {SkillTrack} from '../campaigns/types';
import {applicationStatuses,tracks} from './presentation';
import {apiError,errorMessage} from '../../shared/api/errors';
import {Card} from '../../shared/components/Card';
import {Badge} from '../../shared/components/Badge';
import {Button} from '../../shared/components/Button';
import {Select} from '../../shared/components/Select';
import {Textarea} from '../../shared/components/Textarea';
import {FormField} from '../../shared/components/FormField';
import {Pagination} from '../../shared/components/Pagination';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {EmptyState} from '../../shared/components/EmptyState';

export function ApplicationsPage({mine=false,team=false}:{mine?:boolean;team?:boolean}) {
    useLanguage();
    const{campaignId}=useParams();return <Applications key={String(mine)+String(team)+campaignId} campaignId={campaignId} mine={mine} team={team}/>;
}
function Applications({campaignId,mine,team}:{campaignId?:string;mine:boolean;team:boolean}) {
    useLanguage();
    const [filters,setFilters]=useState<ApplicationFilters>({page:0,status:team?'ACCEPTED':'',track:''});
    const query=useApplications(campaignId,filters,mine);const summary=useRecruitmentSummary(mine?'':campaignId||'');
    const mutation=useChangeApplication();const[action,setAction]=useState<ApplicationAction|null>(null);
    const[review,setReview]=useState<{application:VolunteerApplication;command:'accept'|'reject'}|null>(null);
    const[feedback,setFeedback]=useState('');
    const[preparing,setPreparing]=useState(false);
    const[preparationError,setPreparationError]=useState('');
    async function prepareDecision(next:ApplicationAction) {
        setPreparationError('');setPreparing(true);
        try {
            const fresh=await summary.refetch();
            if(fresh.error){setPreparationError(errorMessage(fresh.error));return;}
            if(!fresh.data?.canReview){setPreparationError(tr("Chiến dịch không còn cho phép xét duyệt đăng ký."));return;}
            setAction(next);
        } finally {setPreparing(false);}
    }
    if(query.isPending)return <LoadingState/>;
    if(query.isError)return <ErrorState message={errorMessage(query.error)} onRetry={()=>void query.refetch()}/>;
    if(!mine&&summary.isPending)return <LoadingState/>;
    if(!mine&&summary.isError&&!summary.data)return <ErrorState message={errorMessage(summary.error)} onRetry={()=>void summary.refetch()}/>;
    const data=query.data;const s=summary.data;
    const warning=action?.command==='accept'&&s?capacityWarning(s,action.assignedTrack):'';
    return <div className="space-y-6"><h1 className="text-3xl font-semibold">{renderText(mine?tr("Đăng ký của tôi"):team?tr("Tình nguyện viên đã duyệt"):tr("Đăng ký tình nguyện"))}</h1>
        {renderText(!mine&&<div className="flex flex-wrap gap-4"><Link className="ui-button ui-button-secondary" to={'/manage/campaigns/'+campaignId}>{tr("Không gian chiến dịch")}</Link><Link className="ui-button ui-button-secondary" to={'/manage/campaigns/'+campaignId+(team?'/applications':'/team')}>{renderText(team?tr("Tất cả đăng ký"):tr("Đội tình nguyện"))}</Link></div>)}
        {renderText(s&&!mine&&<Card><p>{tr("Đã chấp nhận:")}{renderText(s.accepted)} / {renderText(s.targetVolunteerCount??tr("Chưa đặt chỉ tiêu"))} · Technical: {renderText(s.technical)} / {renderText(s.targetTechnicalCount??tr("Chưa đặt chỉ tiêu"))} · Logistics: {renderText(s.logistics)} / {renderText(s.targetLogisticsCount??tr("Chưa đặt chỉ tiêu"))}</p>{renderText(!s.canReview&&<p className="mt-3 text-text-secondary">{tr("Không thể sửa đăng ký ở trạng thái chiến dịch hiện tại.")}</p>)}</Card>)}
        <div className="flex flex-wrap gap-4">{renderText(!team&&<FormField id="application-status" label={tr("Trạng thái")}><Select id="application-status" value={filters.status} onChange={e=>setFilters({...filters,page:0,status:e.target.value as ApplicationFilters['status']})}><option value="">{tr("Tất cả trạng thái")}</option>{renderText(Object.entries(applicationStatuses).map(([value,style])=><option key={value} value={value}>{renderText(style.label)}</option>))}</Select></FormField>)}<FormField id="application-track" label={tr("Nhóm đóng góp")}><Select id="application-track" value={filters.track} onChange={e=>setFilters({...filters,page:0,track:e.target.value as ApplicationFilters['track']})}><option value="">{tr("Tất cả nhóm")}</option>{renderText(Object.entries(tracks).map(([value,label])=><option key={value} value={value}>{renderText(label)}</option>))}</Select></FormField></div>
        {renderText(feedback&&<p role="status" className="text-success">{renderText(feedback)}</p>)}{renderText(mutation.isError&&<ErrorState message={errorMessage(mutation.error)}/>)}{renderText(preparationError&&<ErrorState message={preparationError}/>)}
        {renderText(!data.items.length?<EmptyState message={tr("Không có đăng ký phù hợp với bộ lọc.")}/>:data.items.map(a=><Card key={a.id}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="max-w-full break-words text-xl font-semibold">{renderText(mine?a.campaignTitle:a.fullName)}</h2><Badge tone={applicationStatuses[a.status].tone}>{renderText(applicationStatuses[a.status].label)}</Badge></div>
            {renderText(!mine&&<p className="mt-2 text-text-secondary">{tr("Mã sinh viên:")}{renderText(a.studentId)}</p>)}<Link className="ui-button ui-button-secondary mt-3" to={'/campaigns/'+a.campaignSlug}>{tr("Xem chiến dịch")}</Link>{mine&&a.status==='ACCEPTED'&&<Link className="ui-button ui-button-secondary mt-3 ml-2" to={'/me/campaigns/'+a.campaignId+'/meetings'}>{tr("Lịch họp chiến dịch")}</Link>}
            <p className="mt-3">{tr("Nhóm mong muốn:")}{renderText(tracks[a.preferredTrack])}{renderText(a.assignedTrack&&' · Assigned track: '+tracks[a.assignedTrack])}</p><p className="mt-3 whitespace-pre-wrap break-words">{tr("Lý do tham gia:")}{renderText(a.motivation)}</p>{renderText(a.availability&&<p className="mt-3 whitespace-pre-wrap break-words">{tr("Thời gian tham gia:")}{renderText(a.availability)}</p>)}{renderText(a.rejectionReason&&<p className="mt-3 whitespace-pre-wrap break-words text-danger">{tr("Lý do từ chối:")}{renderText(a.rejectionReason)}</p>)}
            <p className="mt-3 text-sm text-text-secondary">{tr("Đăng ký lúc")}{renderText(new Date(a.createdAt).toLocaleString(locale()))}{renderText(a.reviewedAt&&' · Reviewed '+new Date(a.reviewedAt).toLocaleString(locale()))}</p>
            {renderText(a.status==='PENDING'&&<div className="mt-4 flex flex-wrap gap-3">{renderText(mine?<Button disabled={mutation.isPending||preparing} onClick={()=>{mutation.reset();setFeedback('');setPreparationError('');setAction({id:a.id,command:'cancel',version:a.version});}}>{tr("Hủy đăng ký")}</Button>:s?.canReview&&<><Button disabled={mutation.isPending||preparing} onClick={()=>{mutation.reset();setFeedback('');setPreparationError('');setReview({application:a,command:'accept'});}}>{tr("Chấp nhận")}</Button><Button disabled={mutation.isPending||preparing} onClick={()=>{mutation.reset();setFeedback('');setPreparationError('');setReview({application:a,command:'reject'});}}>{tr("Từ chối")}</Button></>)}</div>)}
        </Card>))}
        <Pagination {...data} onPageChange={page=>setFilters({...filters,page})}/>
        {renderText(review&&<Card><ReviewForm key={review.application.id+review.command} application={review.application} command={review.command} busy={mutation.isPending||preparing} error={mutation.error} onClose={()=>{setPreparationError('');setReview(null);}} onSubmit={next=>void prepareDecision(next)}/></Card>)}
        <ConfirmDialog open={action!==null} title={action?.command==='accept'?tr("Chấp nhận tình nguyện viên?"):action?.command==='reject'?tr("Từ chối đăng ký?"):tr("Hủy đăng ký?")} message={action?.command==='accept'?(tr("Phân công ")+tracks[action.assignedTrack]+' to '+(review?.application.fullName||'this applicant')+'.'+(warning?' '+warning+tr(" Xác nhận chấp nhận vượt chỉ tiêu."):'')):action?.command==='reject'?tr("Đây là quyết định cuối cùng. Sinh viên không thể đăng ký lại chiến dịch này."):tr("Sau khi hủy, bạn không thể đăng ký lại chiến dịch này.")} busy={mutation.isPending} confirmLabel={tr("Xác nhận")} onClose={()=>setAction(null)} onConfirm={()=>{if(action)mutation.mutate(action,{onSuccess:()=>{setReview(null);setFeedback(tr("Đã cập nhật đăng ký."));},onSettled:()=>setAction(null)});}}/>
    </div>;
}
function capacityWarning(s:RecruitmentSummary,track:SkillTrack) {
    const exceedsTotal=s.targetVolunteerCount!==null&&s.accepted+1>s.targetVolunteerCount;
    const target=track==='TECHNICAL'?s.targetTechnicalCount:s.targetLogisticsCount;
    const count=track==='TECHNICAL'?s.technical:s.logistics;
    return exceedsTotal||(target!==null&&count+1>target)?tr("Việc chấp nhận này vượt chỉ tiêu tổng hoặc nhóm đóng góp."):'';
}
function ReviewForm({application,command,busy,error,onSubmit,onClose}:{application:VolunteerApplication;command:'accept'|'reject';busy:boolean;error:unknown;onSubmit:(action:ApplicationAction)=>void;onClose:()=>void}) {
    useLanguage();
    const form=useForm<{assignedTrack:SkillTrack;reason:string}>({defaultValues:{assignedTrack:application.preferredTrack,reason:''}});
    useEffect(()=>{for(const field of apiError(error)?.fieldErrors||[])if(field.field==='reason'||field.field==='assignedTrack')form.setError(field.field,{message:field.message});},[error,form]);
    return <form className="space-y-4" noValidate onSubmit={form.handleSubmit(v=>{
        if(command==='accept'){const parsed=z.enum(['TECHNICAL','LOGISTICS']).safeParse(v.assignedTrack);if(parsed.success)onSubmit({id:application.id,command,assignedTrack:parsed.data,version:application.version});else form.setError('assignedTrack',{message:tr("Chọn nhóm đóng góp")});}
        else{const parsed=z.string().trim().min(1,tr("Nhập lý do từ chối")).max(1000).safeParse(v.reason);if(parsed.success)onSubmit({id:application.id,command,reason:parsed.data,version:application.version});else form.setError('reason',{message:parsed.error.issues[0].message});}
    })}><h2 className="text-xl font-semibold">{renderText(command==='accept'?'Chấp nhận':'Từ chối')} {renderText(application.fullName)}</h2>{renderText(command==='accept'?<FormField id="review-track" label={tr("Nhóm đóng góp được phân công")} error={form.formState.errors.assignedTrack?.message}><Select id="review-track" autoFocus disabled={busy} {...form.register('assignedTrack')}>{renderText(Object.entries(tracks).map(([value,label])=><option key={value} value={value}>{renderText(label)}</option>))}</Select></FormField>:<FormField id="review-reason" label={tr("Lý do từ chối")} error={form.formState.errors.reason?.message}><Textarea id="review-reason" autoFocus maxLength={1000} disabled={busy} {...form.register('reason')}/></FormField>)}<div className="flex gap-3"><Button type="submit" disabled={busy}>{tr("Quyết định xét duyệt")}</Button><Button type="button" disabled={busy} onClick={onClose}>{tr("Đóng")}</Button></div></form>;
}
