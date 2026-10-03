import {Link} from 'react-router-dom';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useAuth} from '../auth/store';
import type {CampaignDetail} from '../campaigns/types';
import {useApplications,useApply} from './hooks';
import type {ApplicationInput} from './types';
import {applicationStatuses,tracks} from './presentation';
import {apiError,errorMessage} from '../../shared/api/errors';
import {Card} from '../../shared/components/Card';
import {Badge} from '../../shared/components/Badge';
import {Button} from '../../shared/components/Button';
import {Select} from '../../shared/components/Select';
import {Textarea} from '../../shared/components/Textarea';
import {FormField} from '../../shared/components/FormField';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
const schema=z.object({preferredTrack:z.enum(['TECHNICAL','LOGISTICS']),motivation:z.string().trim().min(1,'Chia sẻ lý do bạn muốn tham gia').max(1000),availability:z.string().max(1000)});
export function ApplyPanel({campaign}:{campaign:CampaignDetail}) {
    const{user}=useAuth();const existing=useApplications(campaign.id,{page:0,status:'',track:''},true);const mutation=useApply(campaign.id);
    const form=useForm<ApplicationInput>({defaultValues:{preferredTrack:'TECHNICAL',motivation:'',availability:''}});
    const closed=campaign.status!=='OPEN'?'Chỉ nhận đăng ký khi chiến dịch đang mở tuyển.':campaign.content.contributionMode==='DONATION_ONLY'?'Chiến dịch này không tuyển tình nguyện viên.':campaign.content.applicationDeadline&&Date.now()>new Date(campaign.content.applicationDeadline).getTime()?'Đã hết hạn đăng ký.':null;
    return <Card><h2 className="mb-4 text-xl font-semibold">Đăng ký tình nguyện</h2>{!user?<>{closed?<p>{closed}</p>:<Link className="text-primary hover:underline" to="/login" state={{from:'/campaigns/'+campaign.slug}}>Đăng nhập để tham gia</Link>}</>:existing.isPending?<LoadingState/>:existing.isError?<ErrorState message={errorMessage(existing.error)} onRetry={()=>void existing.refetch()}/>:existing.data.items.length?<div className="space-y-3"><Badge tone={applicationStatuses[existing.data.items[0].status].tone}>{applicationStatuses[existing.data.items[0].status].label}</Badge><p>Bạn đã đăng ký. Mỗi sinh viên chỉ được đăng ký một lần cho mỗi chiến dịch.</p><Link className="text-primary hover:underline" to="/me/applications">Xem đăng ký của tôi</Link></div>:closed?<p className="text-text-secondary">{closed}</p>:<form className="space-y-4" noValidate onSubmit={form.handleSubmit(async values=>{
        const parsed=schema.safeParse(values);if(!parsed.success){for(const issue of parsed.error.issues)form.setError(issue.path[0] as keyof ApplicationInput,{message:issue.message});return;}
        try{await mutation.mutateAsync(parsed.data);}catch(error){for(const field of apiError(error)?.fieldErrors||[])if(field.field in values)form.setError(field.field as keyof ApplicationInput,{message:field.message});}
    })}><fieldset disabled={mutation.isPending} className="space-y-4"><FormField id="apply-track" label="Nhóm đóng góp mong muốn" error={form.formState.errors.preferredTrack?.message}><Select id="apply-track" {...form.register('preferredTrack')}>{Object.entries(tracks).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select></FormField><FormField id="apply-motivation" label="Lý do tham gia" error={form.formState.errors.motivation?.message}><Textarea id="apply-motivation" maxLength={1000} {...form.register('motivation')}/></FormField><FormField id="apply-availability" label="Thời gian có thể tham gia (tùy chọn)" error={form.formState.errors.availability?.message}><Textarea id="apply-availability" maxLength={1000} {...form.register('availability')}/></FormField></fieldset>{mutation.isError&&<ErrorState message={errorMessage(mutation.error)}/>}<Button type="submit" disabled={mutation.isPending}>{mutation.isPending?'Đang gửi…':'Đăng ký tình nguyện'}</Button></form>}{mutation.isSuccess&&<p role="status" className="mt-4 text-success">Đã gửi đăng ký tham gia.</p>}</Card>;
}
