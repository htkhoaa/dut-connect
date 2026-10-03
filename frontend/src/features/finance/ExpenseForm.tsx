import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useSaveExpense} from './hooks';
import type {Expense,ExpenseWrite} from './types';
import {apiError,errorMessage} from '../../shared/api/errors';
import {Input} from '../../shared/components/Input';
import {Button} from '../../shared/components/Button';
import {FormField} from '../../shared/components/FormField';
const schema=z.object({title:z.string().trim().min(1,'Vui lòng nhập tiêu đề').max(200),category:z.string().trim().min(1,'Vui lòng chọn danh mục').max(100),amount:z.string().regex(/^[0-9]{1,19}$/,'Nhập số tiền VND nguyên lớn hơn 0').refine(v=>/^[0-9]+$/.test(v)&&BigInt(v)>0n,'Số tiền phải lớn hơn 0'),expenseDate:z.string().regex(/^(?!0000)\d{4}-\d{2}-\d{2}$/,'Nhập ngày hợp lệ trong năm 0001 đến 9999').refine(v=>{const d=new Date(v+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.getUTCFullYear()>=1&&d.getUTCFullYear()<=9999&&d.toISOString().slice(0,10)===v;},'Nhập ngày hợp lệ'),description:z.string().max(2000),proofReference:z.string().max(1000)});
export function ExpenseForm({campaignId,expense,onSaved,onCancel}:{campaignId:string;expense?:Expense;onSaved:()=>void;onCancel:()=>void}){
    const form=useForm<ExpenseWrite>({defaultValues:{title:expense?.title||'',category:expense?.category||'',amount:expense?.amount||'',expenseDate:expense?.expenseDate||'',description:expense?.description||'',proofReference:expense?.proofReference||''}});
    const save=useSaveExpense(campaignId);
    return <form className="space-y-4" onSubmit={form.handleSubmit(values=>{const parsed=schema.safeParse(values);if(!parsed.success){for(const issue of parsed.error.issues)form.setError(issue.path[0] as keyof ExpenseWrite,{message:issue.message});return;}save.mutate({values:parsed.data,expense},{onSuccess:onSaved,onError:error=>{for(const field of apiError(error)?.fieldErrors||[])if(field.field in values)form.setError(field.field as keyof ExpenseWrite,{message:field.message});}});})}>
        <h2 className="text-xl font-semibold">{expense?'Chỉnh sửa chi phí chờ duyệt':'Gửi chi phí'}</h2>
        {(['title','category','amount','expenseDate','description','proofReference'] as const).map(key=><FormField key={key} id={'expense-'+key} label={{title:'Tiêu đề',category:'Danh mục',amount:'Số tiền (VND)',expenseDate:'Ngày chi',description:'Mô tả (tùy chọn)',proofReference:'Tham chiếu chứng từ hoặc liên kết (tùy chọn)'}[key]} error={form.formState.errors[key]?.message}>
            {key==='description'?<textarea className="w-full rounded-lg border border-border bg-surface p-3" id={'expense-'+key} maxLength={2000} rows={3} {...form.register(key)}/>:<Input id={'expense-'+key} type={key==='expenseDate'?'date':'text'} inputMode={key==='amount'?'numeric':undefined} maxLength={{title:200,category:100,amount:19,expenseDate:10,description:2000,proofReference:1000}[key]} {...form.register(key)}/>}</FormField>)}
        {save.isError&&<p role="alert" className="text-danger">{errorMessage(save.error)}</p>}
        <div className="flex flex-wrap gap-3"><Button type="submit" disabled={save.isPending}>{save.isPending?'Đang lưu…':expense?'Lưu chi phí':'Gửi để xét duyệt'}</Button><Button disabled={save.isPending} onClick={onCancel}>Hủy</Button></div>
    </form>;
}
