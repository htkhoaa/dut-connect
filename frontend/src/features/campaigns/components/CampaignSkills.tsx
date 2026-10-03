import {catalogLabel} from '../../../shared/lib/catalogLabels';
import {useEffect,useState} from 'react';
import {useForm,useFieldArray} from 'react-hook-form';
import {z} from 'zod';
import type {CampaignDetail,SkillTrack} from '../types';
import {useSkillCatalog,useReplaceSkills} from '../hooks';
import {errorMessage} from '../../../shared/api/errors';
import {Select} from '../../../shared/components/Select';
import {Input} from '../../../shared/components/Input';
import {Button} from '../../../shared/components/Button';
import {ConfirmDialog} from '../../../shared/components/ConfirmDialog';
import {LoadingState} from '../../../shared/components/LoadingState';
import {ErrorState} from '../../../shared/components/ErrorState';
interface Values {items:{skillId:string;track:SkillTrack;importance:string}[]}
const schema=z.object({items:z.array(z.object({skillId:z.uuid('Chọn kỹ năng'),track:z.enum(['TECHNICAL','LOGISTICS']),importance:z.string().regex(/^[1-5]$/,'Mức quan trọng từ 1 đến 5')})).max(100)});
function defaults(c:CampaignDetail):Values{return {items:c.skills.map(s=>({skillId:s.skillId,track:s.track,importance:String(s.importance)}))};}
export function CampaignSkills({campaign}:{campaign:CampaignDetail}){
    const catalog=useSkillCatalog();const mutation=useReplaceSkills(campaign.id);const form=useForm<Values>({defaultValues:defaults(campaign)});
    const fields=useFieldArray({control:form.control,name:'items'});const [version,setVersion]=useState(campaign.version);const [confirmation,setConfirmation]=useState<Values|null>(null);
    useEffect(()=>{if(!form.formState.isDirty){form.reset(defaults(campaign));setVersion(campaign.version);}},[campaign,form]);
    if(catalog.isPending)return <LoadingState/>;if(catalog.isError)return <ErrorState message={errorMessage(catalog.error)} onRetry={()=>void catalog.refetch()}/>;
    return <section className="space-y-4"><h2 className="text-xl font-semibold">Yêu cầu kỹ năng</h2><form noValidate className="space-y-4" onSubmit={form.handleSubmit(v=>{const parsed=schema.safeParse(v);if(!parsed.success){form.setError('root',{message:parsed.error.issues.map(i=>i.message).join('; ')});return;}if(new Set(v.items.map(s=>s.skillId+s.track)).size!==v.items.length){form.setError('root',{message:'Không được lặp lại cùng kỹ năng và nhóm đóng góp'});return;}form.clearErrors();setConfirmation(v);})}>
        <fieldset disabled={mutation.isPending} className="space-y-3">{fields.fields.map((row,index)=><div key={row.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-4">
            <Select aria-label={'Kỹ năng '+(index+1)} {...form.register(`items.${index}.skillId`)}><option value="">Chọn kỹ năng</option>{catalog.data.map(s=><option value={s.id} key={s.id}>{catalogLabel(s.name)}</option>)}{campaign.skills.some(s=>s.skillId===row.skillId)&&!catalog.data.some(s=>s.id===row.skillId)&&<option value={row.skillId}>{campaign.skills.find(s=>s.skillId===row.skillId)?.name} (ngừng sử dụng)</option>}</Select>
            <Select aria-label={'Nhóm '+(index+1)} {...form.register(`items.${index}.track`)}><option value="TECHNICAL">Kỹ thuật</option><option value="LOGISTICS">Hậu cần</option></Select>
            <Input aria-label={'Mức quan trọng '+(index+1)} type="number" min={1} max={5} {...form.register(`items.${index}.importance`)}/>
            <Button onClick={()=>fields.remove(index)}>Xóa dòng</Button>
        </div>)}</fieldset>
        <div className="flex flex-wrap gap-3"><Button disabled={mutation.isPending||fields.fields.length>=100} onClick={()=>fields.append({skillId:'',track:'TECHNICAL',importance:'3'})}>Thêm yêu cầu</Button><Button type="submit" disabled={mutation.isPending}>Lưu yêu cầu</Button></div>
        {form.formState.errors.root&&<ErrorState message={form.formState.errors.root.message||'Kiểm tra yêu cầu'}/>}
        {mutation.isError&&<ErrorState message={errorMessage(mutation.error)}/>}
        {mutation.isSuccess&&<p role="status" className="text-success">Đã lưu yêu cầu kỹ năng.</p>}
    </form><ConfirmDialog open={confirmation!==null} title="Cập nhật yêu cầu kỹ năng?" message="Yêu cầu hiện tại sẽ được thay bằng các dòng trong biểu mẫu này." busy={mutation.isPending} confirmLabel="Lưu" onClose={()=>setConfirmation(null)} onConfirm={()=>{if(confirmation)mutation.mutate({items:confirmation.items.map(s=>({...s,importance:Number(s.importance)})),version},{onSuccess:updated=>{form.reset(defaults(updated));setVersion(updated.version);},onSettled:()=>setConfirmation(null)});}}/></section>;
}
