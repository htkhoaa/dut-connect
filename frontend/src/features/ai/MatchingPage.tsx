import {catalogLabel} from '../../shared/lib/catalogLabels';
import {useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useAiAvailability,useVolunteerMatches} from './hooks';
import {useApplications,useRecruitmentSummary} from '../volunteers/hooks';
import {tracks} from '../volunteers/presentation';
import {errorMessage,apiError} from '../../shared/api/errors';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {Badge} from '../../shared/components/Badge';
import {Pagination} from '../../shared/components/Pagination';
import {LoadingState} from '../../shared/components/LoadingState';
import {EmptyState} from '../../shared/components/EmptyState';
import {ErrorState} from '../../shared/components/ErrorState';
import type {Confidence} from './types';

const confidences:Record<Confidence,string>={LOW:'Thấp',MEDIUM:'Trung bình',HIGH:'Cao'};

export function MatchingPage(){
    const {campaignId=''}=useParams();return <Matching key={campaignId} campaignId={campaignId}/>;
}
function Matching({campaignId}:{campaignId:string}){
    const [page,setPage]=useState(0);
    const form=useForm<{applicationIds:string[]}>({defaultValues:{applicationIds:[]}});
    const applicants=useApplications(campaignId,{page,status:'PENDING',track:''});
    const latestApplicants=useApplications(campaignId,{page:0,status:'PENDING',track:''});
    const summary=useRecruitmentSummary(campaignId);
    const availability=useAiAvailability(campaignId);
    const matching=useVolunteerMatches(campaignId);
    if(applicants.isPending||summary.isPending||availability.isPending)return <LoadingState/>;
    if(applicants.isError||summary.isError||availability.isError)return <ErrorState message={errorMessage(applicants.error||summary.error||availability.error)} onRetry={()=>{void applicants.refetch();void summary.refetch();void availability.refetch();}}/>;
    const unavailable=!availability.data.available;
    const eligible=summary.data.canReview;
    const selected=form.watch('applicationIds');
    const busy=matching.isPending;
    const max=availability.data.maxApplicants;
    const generate=(ids:string[]|undefined)=>{
        form.clearErrors();
        if(ids){
            const parsed=z.array(z.uuid()).min(1,'Chọn ít nhất một đăng ký.').max(max,'Chọn tối đa '+max+' đăng ký.').safeParse(ids);
            if(!parsed.success){form.setError('applicationIds',{message:parsed.error.issues[0].message});return;}
        }
        matching.mutate(ids,{onError:error=>{
            const field=apiError(error)?.fieldErrors?.find(e=>e.field.startsWith('applicationIds'));
            if(field)form.setError('applicationIds',{message:field.message});
        }});
    };
    return <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Gợi ý tình nguyện viên với AI</h1>
        <p className="font-medium">Gợi ý AI — quyết định cuối cùng thuộc về bạn</p>
        <div className="flex flex-wrap gap-4"><Link className="text-primary hover:underline" to={'/manage/campaigns/'+campaignId}>Không gian chiến dịch</Link><Link className="text-primary hover:underline" to={'/manage/campaigns/'+campaignId+'/applications'}>Xét duyệt đăng ký</Link></div>
        <p className="text-text-secondary">Gợi ý dựa trên yêu cầu chiến dịch, kỹ năng, kinh nghiệm và thời gian tham gia. Việc tạo gợi ý không thay đổi trạng thái đăng ký.</p>
        {unavailable&&<Card><p role="status">Gợi ý AI chưa khả dụng. Bạn có thể tiếp tục xét duyệt đăng ký.</p></Card>}
        {!eligible&&<p role="status">Gợi ý phù hợp dành cho chiến dịch tình nguyện đang mở hoặc đang hoạt động.</p>}
        <form noValidate className="space-y-4" onSubmit={form.handleSubmit(values=>generate(values.applicationIds))}>
            <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy||unavailable||!eligible||!applicants.data.items.length}>{busy?'Đang tạo gợi ý…':'Gợi ý cho người được chọn'}</Button>
                <Button disabled={busy||unavailable||!eligible||!applicants.data.items.length||latestApplicants.isFetching} onClick={()=>{if(latestApplicants.isError){form.setError('applicationIds',{message:'Làm mới danh sách trước khi tạo gợi ý cho những đăng ký mới nhất.'});return;}setPage(0);form.reset();generate(undefined);}}>Gợi ý cho đăng ký chờ duyệt mới nhất (tối đa {max})</Button>
                <Button disabled={busy||applicants.isFetching} onClick={()=>{matching.reset();form.reset();void applicants.refetch();void summary.refetch();void availability.refetch();}}>Làm mới đăng ký</Button></div>
            {form.formState.errors.applicationIds?.message&&<p role="alert" className="text-danger">{form.formState.errors.applicationIds.message}</p>}
            <p>{selected.length} được chọn · tối đa {max}. Lựa chọn áp dụng cho trang hiện tại.</p>
            {!applicants.data.items.length?<EmptyState message="Chưa có đăng ký chờ duyệt để gợi ý."/>:applicants.data.items.map(a=><Card key={a.id}>
                <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-4 w-4 shrink-0" value={a.id} disabled={busy||unavailable||!eligible} {...form.register('applicationIds')}/><span className="min-w-0 break-words"><span className="font-semibold">{a.fullName}</span><span className="block text-text-secondary">Nhóm mong muốn: {tracks[a.preferredTrack]}</span>{a.availability&&<span className="block whitespace-pre-wrap">Thời gian tham gia: {a.availability}</span>}</span></label>
            </Card>)}
        </form>
        <Pagination {...applicants.data} hasNext={!busy&&applicants.data.hasNext} hasPrevious={!busy&&applicants.data.hasPrevious} onPageChange={value=>{setPage(value);form.reset();matching.reset();}}/>
        {matching.isError&&<ErrorState message={errorMessage(matching.error)}/>}
        {matching.data&&<section className="space-y-4" aria-label="Gợi ý AI">
            <h2 className="text-xl font-semibold">Gợi ý</h2>
            <p className="break-words text-sm text-text-secondary">Tạo lúc {new Date(matching.data.generatedAt).toLocaleString('vi-VN')} · Mô hình: {matching.data.model}. Gợi ý phản ánh dữ liệu tại thời điểm tạo; hãy làm mới sau khi có thay đổi.</p>
            {!matching.data.recommendations.length?<EmptyState message="Không có đăng ký chờ duyệt phù hợp."/>:matching.data.recommendations.map(r=><Card key={r.applicationId}>
                <h3 className="break-words text-lg font-semibold">{applicants.data.items.find(a=>a.id===r.applicationId)?.fullName||latestApplicants.data?.items.find(a=>a.id===r.applicationId)?.fullName||('Đăng ký '+r.applicationId)}</h3>
                <div className="mt-3 flex flex-wrap gap-3"><Badge>Điểm gợi ý: {r.score}/100</Badge><Badge>{confidences[r.confidence]} độ tin cậy</Badge></div>
                <p className="mt-3">Nhóm gợi ý: {tracks[r.recommendedTrack]}</p>
                <p className="mt-3 break-words">Kỹ năng phù hợp: {r.matchedSkills.map(catalogLabel).join(', ')||'Không có'}</p>
                <p className="mt-2 break-words">Kỹ năng còn thiếu: {r.missingSkills.map(catalogLabel).join(', ')||'Không có'}</p>
                <p className="mt-3 whitespace-pre-wrap break-words">{r.reason}</p>
            </Card>)}
        </section>}
    </div>;
}
