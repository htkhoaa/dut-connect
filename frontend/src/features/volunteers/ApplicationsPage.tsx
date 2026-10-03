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
    const{campaignId}=useParams();return <Applications key={String(mine)+String(team)+campaignId} campaignId={campaignId} mine={mine} team={team}/>;
}
function Applications({campaignId,mine,team}:{campaignId?:string;mine:boolean;team:boolean}) {
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
            if(!fresh.data?.canReview){setPreparationError('Chiến dịch không còn cho phép xét duyệt đăng ký.');return;}
            setAction(next);
        } finally {setPreparing(false);}
    }
    if(query.isPending)return <LoadingState/>;
    if(query.isError)return <ErrorState message={errorMessage(query.error)} onRetry={()=>void query.refetch()}/>;
    if(!mine&&summary.isPending)return <LoadingState/>;
    if(!mine&&summary.isError&&!summary.data)return <ErrorState message={errorMessage(summary.error)} onRetry={()=>void summary.refetch()}/>;
    const data=query.data;const s=summary.data;
    const warning=action?.command==='accept'&&s?capacityWarning(s,action.assignedTrack):'';
    return <div className="space-y-6"><h1 className="text-3xl font-semibold">{mine?'Đăng ký của tôi':team?'Tình nguyện viên đã duyệt':'Đăng ký tình nguyện'}</h1>
        {!mine&&<div className="flex flex-wrap gap-4"><Link className="text-primary hover:underline" to={'/manage/campaigns/'+campaignId}>Không gian chiến dịch</Link><Link className="text-primary hover:underline" to={'/manage/campaigns/'+campaignId+(team?'/applications':'/team')}>{team?'Tất cả đăng ký':'Đội tình nguyện'}</Link></div>}
        {s&&!mine&&<Card><p>Đã chấp nhận: {s.accepted} / {s.targetVolunteerCount??'Chưa đặt chỉ tiêu'} · Technical: {s.technical} / {s.targetTechnicalCount??'Chưa đặt chỉ tiêu'} · Logistics: {s.logistics} / {s.targetLogisticsCount??'Chưa đặt chỉ tiêu'}</p>{!s.canReview&&<p className="mt-3 text-text-secondary">Không thể sửa đăng ký ở trạng thái chiến dịch hiện tại.</p>}</Card>}
        <div className="flex flex-wrap gap-4">{!team&&<FormField id="application-status" label="Trạng thái"><Select id="application-status" value={filters.status} onChange={e=>setFilters({...filters,page:0,status:e.target.value as ApplicationFilters['status']})}><option value="">Tất cả trạng thái</option>{Object.entries(applicationStatuses).map(([value,style])=><option key={value} value={value}>{style.label}</option>)}</Select></FormField>}<FormField id="application-track" label="Nhóm đóng góp"><Select id="application-track" value={filters.track} onChange={e=>setFilters({...filters,page:0,track:e.target.value as ApplicationFilters['track']})}><option value="">Tất cả nhóm</option>{Object.entries(tracks).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select></FormField></div>
        {feedback&&<p role="status" className="text-success">{feedback}</p>}{mutation.isError&&<ErrorState message={errorMessage(mutation.error)}/>}{preparationError&&<ErrorState message={preparationError}/>}
        {!data.items.length?<EmptyState message="Không có đăng ký phù hợp với bộ lọc."/>:data.items.map(a=><Card key={a.id}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="max-w-full break-words text-xl font-semibold">{mine?a.campaignTitle:a.fullName}</h2><Badge tone={applicationStatuses[a.status].tone}>{applicationStatuses[a.status].label}</Badge></div>
            {!mine&&<p className="mt-2 text-text-secondary">Mã sinh viên: {a.studentId}</p>}<Link className="mt-3 inline-block text-primary hover:underline" to={'/campaigns/'+a.campaignSlug}>Xem chiến dịch</Link>
            <p className="mt-3">Nhóm mong muốn: {tracks[a.preferredTrack]}{a.assignedTrack&&' · Assigned track: '+tracks[a.assignedTrack]}</p><p className="mt-3 whitespace-pre-wrap break-words">Lý do tham gia: {a.motivation}</p>{a.availability&&<p className="mt-3 whitespace-pre-wrap break-words">Thời gian tham gia: {a.availability}</p>}{a.rejectionReason&&<p className="mt-3 whitespace-pre-wrap break-words text-danger">Lý do từ chối: {a.rejectionReason}</p>}
            <p className="mt-3 text-sm text-text-secondary">Đăng ký lúc {new Date(a.createdAt).toLocaleString('vi-VN')}{a.reviewedAt&&' · Reviewed '+new Date(a.reviewedAt).toLocaleString('vi-VN')}</p>
            {a.status==='PENDING'&&<div className="mt-4 flex flex-wrap gap-3">{mine?<Button disabled={mutation.isPending||preparing} onClick={()=>{mutation.reset();setFeedback('');setPreparationError('');setAction({id:a.id,command:'cancel',version:a.version});}}>Hủy đăng ký</Button>:s?.canReview&&<><Button disabled={mutation.isPending||preparing} onClick={()=>{mutation.reset();setFeedback('');setPreparationError('');setReview({application:a,command:'accept'});}}>Chấp nhận</Button><Button disabled={mutation.isPending||preparing} onClick={()=>{mutation.reset();setFeedback('');setPreparationError('');setReview({application:a,command:'reject'});}}>Từ chối</Button></>}</div>}
        </Card>)}
        <Pagination {...data} onPageChange={page=>setFilters({...filters,page})}/>
        {review&&<Card><ReviewForm key={review.application.id+review.command} application={review.application} command={review.command} busy={mutation.isPending||preparing} error={mutation.error} onClose={()=>{setPreparationError('');setReview(null);}} onSubmit={next=>void prepareDecision(next)}/></Card>}
        <ConfirmDialog open={action!==null} title={action?.command==='accept'?'Chấp nhận tình nguyện viên?':action?.command==='reject'?'Từ chối đăng ký?':'Hủy đăng ký?'} message={action?.command==='accept'?('Phân công '+tracks[action.assignedTrack]+' to '+(review?.application.fullName||'this applicant')+'.'+(warning?' '+warning+' Xác nhận chấp nhận vượt chỉ tiêu.':'')):action?.command==='reject'?'Đây là quyết định cuối cùng. Sinh viên không thể đăng ký lại chiến dịch này.':'Sau khi hủy, bạn không thể đăng ký lại chiến dịch này.'} busy={mutation.isPending} confirmLabel="Xác nhận" onClose={()=>setAction(null)} onConfirm={()=>{if(action)mutation.mutate(action,{onSuccess:()=>{setReview(null);setFeedback('Đã cập nhật đăng ký.');},onSettled:()=>setAction(null)});}}/>
    </div>;
}
function capacityWarning(s:RecruitmentSummary,track:SkillTrack) {
    const exceedsTotal=s.targetVolunteerCount!==null&&s.accepted+1>s.targetVolunteerCount;
    const target=track==='TECHNICAL'?s.targetTechnicalCount:s.targetLogisticsCount;
    const count=track==='TECHNICAL'?s.technical:s.logistics;
    return exceedsTotal||(target!==null&&count+1>target)?'Việc chấp nhận này vượt chỉ tiêu tổng hoặc nhóm đóng góp.':'';
}
function ReviewForm({application,command,busy,error,onSubmit,onClose}:{application:VolunteerApplication;command:'accept'|'reject';busy:boolean;error:unknown;onSubmit:(action:ApplicationAction)=>void;onClose:()=>void}) {
    const form=useForm<{assignedTrack:SkillTrack;reason:string}>({defaultValues:{assignedTrack:application.preferredTrack,reason:''}});
    useEffect(()=>{for(const field of apiError(error)?.fieldErrors||[])if(field.field==='reason'||field.field==='assignedTrack')form.setError(field.field,{message:field.message});},[error,form]);
    return <form className="space-y-4" noValidate onSubmit={form.handleSubmit(v=>{
        if(command==='accept'){const parsed=z.enum(['TECHNICAL','LOGISTICS']).safeParse(v.assignedTrack);if(parsed.success)onSubmit({id:application.id,command,assignedTrack:parsed.data,version:application.version});else form.setError('assignedTrack',{message:'Chọn nhóm đóng góp'});}
        else{const parsed=z.string().trim().min(1,'Nhập lý do từ chối').max(1000).safeParse(v.reason);if(parsed.success)onSubmit({id:application.id,command,reason:parsed.data,version:application.version});else form.setError('reason',{message:parsed.error.issues[0].message});}
    })}><h2 className="text-xl font-semibold">{command==='accept'?'Chấp nhận':'Từ chối'} {application.fullName}</h2>{command==='accept'?<FormField id="review-track" label="Nhóm đóng góp được phân công" error={form.formState.errors.assignedTrack?.message}><Select id="review-track" autoFocus disabled={busy} {...form.register('assignedTrack')}>{Object.entries(tracks).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select></FormField>:<FormField id="review-reason" label="Lý do từ chối" error={form.formState.errors.reason?.message}><Textarea id="review-reason" autoFocus maxLength={1000} disabled={busy} {...form.register('reason')}/></FormField>}<div className="flex gap-3"><Button type="submit" disabled={busy}>Quyết định xét duyệt</Button><Button type="button" disabled={busy} onClick={onClose}>Đóng</Button></div></form>;
}
