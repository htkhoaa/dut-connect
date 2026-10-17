import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {catalogLabel} from '../../shared/lib/catalogLabels';
import {useState,useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import type {Category,CategoryWrite} from './types';
import {useCategories,useSaveCategory} from './hooks';
import {apiError,errorMessage} from '../../shared/api/errors';
import {Card} from '../../shared/components/Card';
import {Input} from '../../shared/components/Input';
import {Textarea} from '../../shared/components/Textarea';
import {Button} from '../../shared/components/Button';
import {FormField} from '../../shared/components/FormField';
import {Table} from '../../shared/components/Table';
import {Pagination} from '../../shared/components/Pagination';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {EmptyState} from '../../shared/components/EmptyState';
const schema=z.object({name:z.string().trim().min(1,'Nhập tên danh mục').max(120),description:z.string().max(300),active:z.boolean()});
export function CategoryManagementPage(){
    useLanguage();
    const [page,setPage]=useState(0);const [selected,setSelected]=useState<Category|undefined>();const [feedback,setFeedback]=useState('');const [confirm,setConfirm]=useState<{id?:string;values:CategoryWrite}|null>(null);
    const list=useCategories(page,true);const mutation=useSaveCategory();const form=useForm<{name:string;description:string;active:boolean}>({defaultValues:{name:'',description:'',active:true}});
    useEffect(()=>{form.reset({name:selected?.name||'',description:selected?.description||'',active:selected?.active??true});mutation.reset();},[selected,form]);
    return <div className="space-y-6"><h1 className="text-3xl font-semibold">{tr("Danh mục chiến dịch")}</h1><Card><h2 className="mb-4 text-xl font-semibold">{renderText(selected?tr("Chỉnh sửa danh mục"):tr("Tạo danh mục"))}</h2><form noValidate className="space-y-4" onSubmit={form.handleSubmit(async input=>{
        setFeedback('');const parsed=schema.safeParse(input);if(!parsed.success){for(const issue of parsed.error.issues)form.setError(issue.path[0] as 'name'|'description'|'active',{message:issue.message});return;}
        const values={...parsed.data,version:selected?.version};
        if(selected?.active&&!values.active){setConfirm({id:selected.id,values});return;}
        try{const saved=await mutation.mutateAsync({id:selected?.id,values});setSelected(saved);setFeedback(tr("Đã lưu danh mục."));}catch(error){for(const field of apiError(error)?.fieldErrors||[])if(field.field==='name'||field.field==='description')form.setError(field.field,{message:field.message});}
    })}><fieldset disabled={mutation.isPending} className="space-y-4"><FormField id="category-name" label={tr("Tên")} error={form.formState.errors.name?.message}><Input id="category-name" maxLength={120} {...form.register('name')}/></FormField><FormField id="category-description" label={tr("Mô tả")} error={form.formState.errors.description?.message}><Textarea id="category-description" maxLength={300} {...form.register('description')}/></FormField><label className="flex items-center gap-3"><input type="checkbox" {...form.register('active')}/>{tr("Đang hoạt động")}</label></fieldset><div className="flex gap-3"><Button type="submit" disabled={mutation.isPending}>{renderText(mutation.isPending?tr("Đang lưu…"):tr("Lưu danh mục"))}</Button>{renderText(selected&&<Button disabled={mutation.isPending} onClick={()=>{setSelected(undefined);setFeedback('');}}>{tr("Danh mục mới")}</Button>)}</div>{renderText(feedback&&<p role="status" className="text-success">{renderText(feedback)}</p>)}{renderText(mutation.isError&&<ErrorState message={errorMessage(mutation.error)}/>)}</form></Card>
        {renderText(list.isPending?<LoadingState/>:list.isError?<ErrorState message={errorMessage(list.error)} onRetry={()=>void list.refetch()}/>:<>{list.data.items.length===0?<EmptyState message={tr("Chưa có danh mục.")}/>:<Table caption={tr("Danh mục chiến dịch")}><thead><tr>{renderText([tr("Tên"),tr("Trạng thái"),tr("Thao tác")].map(x=><th key={x} scope="col" className="p-4">{renderText(x)}</th>))}</tr></thead><tbody>{renderText(list.data.items.map(c=><tr key={c.id} className="border-t border-border"><td className="p-4">{renderText(catalogLabel(c.name))}</td><td className="p-4">{renderText(c.active?tr("Đang hoạt động"):tr("Ngừng sử dụng"))}</td><td className="p-4"><Button disabled={mutation.isPending} onClick={()=>{setSelected(c);setFeedback('');}}>{tr("Chỉnh sửa")}</Button></td></tr>))}</tbody></Table>}<Pagination {...list.data} onPageChange={setPage}/></>)}
        <ConfirmDialog open={confirm!==null} title={tr("Ngừng sử dụng danh mục?")} message={tr("Danh mục sẽ không còn dùng cho đề xuất mới. Các bản ghi hiện có vẫn giữ danh mục.")} busy={mutation.isPending} confirmLabel={tr("Ngừng sử dụng")} onClose={()=>setConfirm(null)} onConfirm={()=>{if(confirm)mutation.mutate(confirm,{onSuccess:saved=>{setSelected(saved);setFeedback(tr("Đã lưu danh mục."));},onSettled:()=>setConfirm(null)});}}/>
    </div>;
}
