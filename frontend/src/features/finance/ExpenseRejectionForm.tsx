import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import type {Expense} from './types';
import {useReviewExpense} from './hooks';
import {apiError,errorMessage} from '../../shared/api/errors';
import {Button} from '../../shared/components/Button';
import {Textarea} from '../../shared/components/Textarea';
import {FormField} from '../../shared/components/FormField';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';

const schema=z.object({reason:z.string().trim().min(1,'Vui lòng nhập lý do từ chối.').max(1000,'Nhập tối đa 1000 ký tự.')});

export function ExpenseRejectionForm({expense,onSaved,onCancel}:{expense:Expense;onSaved:()=>void;onCancel:()=>void}){
    const form=useForm<{reason:string}>({defaultValues:{reason:''}});
    const review=useReviewExpense();
    const [reason,setReason]=useState<string|null>(null);
    return <form noValidate className="space-y-3" onSubmit={form.handleSubmit(values=>{
        const parsed=schema.safeParse(values);
        if(!parsed.success){form.setError('reason',{message:parsed.error.issues[0].message});return;}
        setReason(parsed.data.reason);
    })}>
        <FormField id="rejection-reason" label="Lý do từ chối" error={form.formState.errors.reason?.message}>
            <Textarea id="rejection-reason" maxLength={1000} rows={3} disabled={review.isPending} {...form.register('reason')}/>
        </FormField>
        {review.isError&&<p role="alert" className="text-danger">{errorMessage(review.error)}</p>}
        <div className="flex flex-wrap gap-3"><Button type="submit" disabled={review.isPending}>Xác nhận từ chối</Button><Button disabled={review.isPending} onClick={onCancel}>Hủy</Button></div>
        <ConfirmDialog open={reason!==null} title="Từ chối chi phí?" message="Từ chối là quyết định cuối cùng. Chi phí sẽ không được tính vào số liệu công khai." confirmLabel="Xác nhận xét duyệt" busy={review.isPending} onClose={()=>setReason(null)} onConfirm={()=>{
            if(reason!==null)review.mutate({id:expense.id,version:expense.version,command:'reject',reason},{
                onSuccess:onSaved,
                onError:error=>{
                    setReason(null);
                    for(const field of apiError(error)?.fieldErrors||[])if(field.field==='reason')form.setError('reason',{message:field.message});
                }
            });
        }}/>
    </form>;
}
