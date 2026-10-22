import {useLanguage, tr, renderText} from "../../../shared/lib/i18n";
import {catalogLabel} from '../../../shared/lib/catalogLabels';
import {useEffect,useState} from 'react';
import {useForm,type FieldPath} from 'react-hook-form';
import {z} from 'zod';
import {useNavigate} from 'react-router-dom';
import type {Content,FormValues} from '../types';
import {useCategoryCatalog,useOrganizationOptions,useEditCampaign} from '../hooks';
import {useSaveProposal} from '../../proposals/hooks';
import {modes,organizers} from '../presentation';
import {apiError,errorMessage} from '../../../shared/api/errors';
import {FormField} from '../../../shared/components/FormField';
import {Input} from '../../../shared/components/Input';
import {Select} from '../../../shared/components/Select';
import {Textarea} from '../../../shared/components/Textarea';
import {Button} from '../../../shared/components/Button';
import {ErrorState} from '../../../shared/components/ErrorState';
import {LoadingState} from '../../../shared/components/LoadingState';

const optionalMoney=z.string().trim().refine(v=>!v||/^\d{1,19}$/.test(v),'Nhập số tiền VND nguyên, tối đa 19 chữ số');
const optionalCount=z.string().trim().refine(v=>!v||(/^\d+$/.test(v)&&Number(v)<=2147483647),'Nhập số nguyên không âm');
const schema=z.object({
    organizerType:z.enum(['INDIVIDUAL','ORGANIZATION']),organizationId:z.string(),categoryId:z.uuid('Chọn danh mục'),
    title:z.string().trim().min(1).max(200),summary:z.string().trim().min(1).max(500),description:z.string().trim().min(1).max(20000),
    expectedImpact:z.string().max(10000),contributionMode:z.enum(['VOLUNTEER_ONLY','DONATION_ONLY','HYBRID']),
    startDate:z.string().min(1,'Chọn ngày bắt đầu'),endDate:z.string().min(1,'Chọn ngày kết thúc'),
    applicationDeadline:z.string(),fundraisingDeadline:z.string(),
    targetVolunteerCount:optionalCount,targetTechnicalCount:optionalCount,targetLogisticsCount:optionalCount,
    volunteerRequirements:z.string().max(10000),fundraisingGoal:optionalMoney,institutionalFunding:optionalMoney,
    sponsorName:z.string().max(200),sponsorFunding:optionalMoney,estimatedBudget:optionalMoney
}).superRefine((v,ctx)=>{
    if(v.endDate<v.startDate)ctx.addIssue({code:'custom',path:['endDate'],message:tr("Ngày kết thúc không được trước ngày bắt đầu")});
    if(v.organizerType==='ORGANIZATION'&&!z.uuid().safeParse(v.organizationId).success)ctx.addIssue({code:'custom',path:['organizationId'],message:tr("Chọn tổ chức đã xác minh")});
    if(v.contributionMode!=='DONATION_ONLY'&&(!v.targetVolunteerCount||Number(v.targetVolunteerCount)<1))ctx.addIssue({code:'custom',path:['targetVolunteerCount'],message:tr("Cần ít nhất một vị trí tình nguyện")});
    if(v.fundraisingGoal&&/^\d+$/.test(v.fundraisingGoal)&&BigInt(v.fundraisingGoal)===0n)ctx.addIssue({code:'custom',path:['fundraisingGoal'],message:tr("Mục tiêu phải lớn hơn 0")});
    for(const name of ['applicationDeadline','fundraisingDeadline'] as const)if(v[name]&&Number.isNaN(new Date(v[name]).getTime()))ctx.addIssue({code:'custom',path:[name],message:tr("Nhập ngày và giờ hợp lệ")});
});
function localTime(value:string|null|undefined){
    if(!value)return '';
    const date=new Date(value);return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,23);
}
function defaults(content?:Content):FormValues{
    return {organizerType:content?.organizerType||'INDIVIDUAL',organizationId:content?.organizationId||'',categoryId:content?.categoryId||'',
        title:content?.title||'',summary:content?.summary||'',description:content?.description||'',expectedImpact:content?.expectedImpact||'',
        contributionMode:content?.contributionMode||'VOLUNTEER_ONLY',startDate:content?.startDate||'',endDate:content?.endDate||'',
        applicationDeadline:localTime(content?.applicationDeadline),fundraisingDeadline:localTime(content?.fundraisingDeadline),
        targetVolunteerCount:content?.targetVolunteerCount?.toString()||'',targetTechnicalCount:content?.targetTechnicalCount?.toString()||'',targetLogisticsCount:content?.targetLogisticsCount?.toString()||'',
        volunteerRequirements:content?.volunteerRequirements||'',fundraisingGoal:content?.fundraisingGoal||'',institutionalFunding:content?.institutionalFunding||'0',
        sponsorName:content?.sponsorName||'',sponsorFunding:content?.sponsorFunding||'0',estimatedBudget:content?.estimatedBudget||''};
}
function instant(value:string,original?:string|null){
    const date=new Date(value);
    return original&&date.getTime()===new Date(original).getTime()?original:date.toISOString();
}
function payload(v:FormValues,original?:Content):Content{
    const donations=v.contributionMode!=='VOLUNTEER_ONLY';const volunteers=v.contributionMode!=='DONATION_ONLY';
    return {...v,organizerType:v.organizerType as Content['organizerType'],contributionMode:v.contributionMode as Content['contributionMode'],
        organizationId:v.organizerType==='ORGANIZATION'?v.organizationId:null,
        expectedImpact:v.expectedImpact.trim()||null,
        targetVolunteerCount:volunteers&&v.targetVolunteerCount?Number(v.targetVolunteerCount):null,
        targetTechnicalCount:volunteers&&v.targetTechnicalCount?Number(v.targetTechnicalCount):null,
        targetLogisticsCount:volunteers&&v.targetLogisticsCount?Number(v.targetLogisticsCount):null,
        applicationDeadline:volunteers&&v.applicationDeadline?instant(v.applicationDeadline,original?.applicationDeadline):null,
        fundraisingDeadline:donations&&v.fundraisingDeadline?instant(v.fundraisingDeadline,original?.fundraisingDeadline):null,
        fundraisingGoal:donations?v.fundraisingGoal||null:null,volunteerRequirements:volunteers?v.volunteerRequirements.trim()||null:null,
        institutionalFunding:v.institutionalFunding||'0',sponsorFunding:v.sponsorFunding||'0',sponsorName:v.sponsorName.trim()||null,estimatedBudget:v.estimatedBudget||null};
}
export function PlanForm({kind='proposal',id,content,version:initialVersion,categoryName,organizationName,modeLocked=false}:{kind?:'proposal'|'campaign';id?:string;content?:Content;version?:number;categoryName?:string;organizationName?:string;modeLocked?:boolean}){
    useLanguage();
    const categories=useCategoryCatalog();const organizations=useOrganizationOptions('mine');
    const proposal=useSaveProposal(kind==='proposal'?id:undefined);const campaign=useEditCampaign(id||'');
    const form=useForm<FormValues>({defaultValues:defaults(content)});const [version,setVersion]=useState(initialVersion);
    const navigate=useNavigate();const mutation=kind==='proposal'?proposal:campaign;
    const mode=form.watch('contributionMode');const organizer=form.watch('organizerType');
    useEffect(()=>{if(content&&!form.formState.isDirty){form.reset(defaults(content));setVersion(initialVersion);}},[content,initialVersion,form]);
    const submit=form.handleSubmit(async input=>{
        const parsed=schema.safeParse(input);
        if(!parsed.success){for(const issue of parsed.error.issues)form.setError(issue.path[0] as FieldPath<FormValues>,{message:issue.message});return;}
        try{
            const result=await mutation.mutateAsync({content:payload(parsed.data,content),version});
            form.reset(defaults(result.content));setVersion(result.version);
            if(!id)navigate('/proposals/'+result.id);
        }catch(error){
            form.setError('root',{message:errorMessage(error)});
            for(const field of apiError(error)?.fieldErrors||[]){
                const name=field.field.replace(/^content\./,'') as keyof FormValues;
                if(name in input)form.setError(name,{message:field.message});
            }
        }
    });
    if(categories.isPending||organizations.isPending)return <LoadingState message={tr("Đang tải thông tin đề xuất…")}/>;
    if(categories.isError||organizations.isError)return <ErrorState message={errorMessage(categories.error||organizations.error)} onRetry={()=>{void categories.refetch();void organizations.refetch();}}/>;
    function input(name:keyof FormValues,label:string,type='text',max?:number){return <FormField id={'plan-'+name} label={label} error={form.formState.errors[name]?.message}><Input id={'plan-'+name} type={type} step={type==='datetime-local'?'0.001':undefined} maxLength={max} {...form.register(name)}/></FormField>;}
    function area(name:keyof FormValues,label:string,max:number){return <FormField id={'plan-'+name} label={label} error={form.formState.errors[name]?.message}><Textarea id={'plan-'+name} rows={4} maxLength={max} {...form.register(name)}/></FormField>;}
    return <form noValidate onSubmit={submit} className="space-y-5">
        <fieldset disabled={mutation.isPending} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <FormField id="plan-organizerType" label={tr("Đơn vị tổ chức")} error={form.formState.errors.organizerType?.message}><Select id="plan-organizerType" disabled={kind==='campaign'} {...form.register('organizerType')}>{renderText(Object.entries(organizers).map(([value,label])=><option key={value} value={value}>{renderText(label)}</option>))}</Select></FormField>
                <FormField id="plan-categoryId" label={tr("Danh mục")} error={form.formState.errors.categoryId?.message}><Select id="plan-categoryId" {...form.register('categoryId')}><option value="">{tr("Chọn danh mục")}</option>{renderText(categories.data.map(c=><option key={c.id} value={c.id}>{renderText(catalogLabel(c.name))}</option>))}{renderText(content&&!categories.data.some(c=>c.id===content.categoryId)&&<option value={content.categoryId}>{renderText(categoryName)}{tr("(ngừng sử dụng)")}</option>)}</Select></FormField>
            </div>
            {renderText(organizer==='ORGANIZATION'&&<FormField id="plan-organizationId" label={tr("Tổ chức đã xác minh (cần quyền sở hữu hoặc quản lý)")} error={form.formState.errors.organizationId?.message}><Select id="plan-organizationId" disabled={kind==='campaign'} {...form.register('organizationId')}><option value="">{tr("Chọn tổ chức")}</option>{renderText(organizations.data.map(o=><option key={o.id} value={o.id}>{renderText(o.name)}</option>))}{renderText(content?.organizationId&&!organizations.data.some(o=>o.id===content.organizationId)&&<option value={content.organizationId}>{renderText(organizationName||tr("Tổ chức hiện tại"))}</option>)}</Select></FormField>)}
            {renderText(input('title',tr("Tiêu đề"),'text',200))}{renderText(area('summary',tr("Tóm tắt"),500))}{renderText(area('description',tr("Mô tả"),20000))}{renderText(area('expectedImpact',tr("Giá trị hướng đến"),10000))}
            <FormField id="plan-contributionMode" label={tr("Hình thức đóng góp")} error={form.formState.errors.contributionMode?.message}><Select id="plan-contributionMode" disabled={modeLocked} {...form.register('contributionMode')}>{renderText(Object.entries(modes).map(([value,label])=><option key={value} value={value}>{renderText(label)}</option>))}</Select></FormField>
            <div className="grid gap-4 sm:grid-cols-2">{renderText(input('startDate',tr("Ngày bắt đầu"),'date'))}{renderText(input('endDate',tr("Ngày kết thúc"),'date'))}</div>
            {renderText(mode!=='DONATION_ONLY'&&<><h3 className="text-lg font-semibold">{tr("Chỉ tiêu tình nguyện")}</h3><div className="grid gap-4 sm:grid-cols-3">{renderText(input('targetVolunteerCount',tr("Tổng tình nguyện viên")))}{renderText(input('targetTechnicalCount',tr("Chỉ tiêu kỹ thuật")))}{renderText(input('targetLogisticsCount',tr("Chỉ tiêu hậu cần")))}</div>{input('applicationDeadline',tr("Hạn đăng ký (giờ địa phương)"),'datetime-local')}{area('volunteerRequirements',tr("Yêu cầu tình nguyện viên"),10000)}</>)}
            {renderText(mode!=='VOLUNTEER_ONLY'&&<><h3 className="text-lg font-semibold">{tr("Kế hoạch gây quỹ")}</h3>{input('fundraisingGoal',tr("Mục tiêu gây quỹ (VND)"))}{input('fundraisingDeadline',tr("Hạn gây quỹ (giờ địa phương)"),'datetime-local')}</>)}
            <h3 className="text-lg font-semibold">{tr("Tài trợ và ngân sách dự kiến")}</h3>
            <div className="grid gap-4 sm:grid-cols-2">{renderText(input('institutionalFunding',tr("Kinh phí nhà trường (VND)")))}{renderText(input('sponsorFunding',tr("Kinh phí tài trợ (VND)")))}{renderText(input('sponsorName',tr("Nhà tài trợ"),'text',200))}{renderText(input('estimatedBudget',tr("Ngân sách dự kiến (VND)")))}</div>
        </fieldset>
        {renderText(form.formState.errors.root&&<ErrorState message={form.formState.errors.root.message||tr("Chưa thể lưu")}/>)}
        {renderText(mutation.isSuccess&&id&&<p role="status" className="text-success">{tr("Đã lưu thay đổi.")}</p>)}
        <Button type="submit" disabled={mutation.isPending}>{renderText(mutation.isPending?tr("Đang lưu…"):id?tr("Lưu thay đổi"):tr("Gửi đề xuất"))}</Button>
    </form>;
}
