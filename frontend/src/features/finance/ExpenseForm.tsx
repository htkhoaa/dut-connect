import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useState, useRef} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useSaveExpense} from './hooks';
import type {Expense,ExpenseWrite} from './types';
import {apiError,errorMessage} from '../../shared/api/errors';
import {Input} from '../../shared/components/Input';
import {Button} from '../../shared/components/Button';
import {FormField} from '../../shared/components/FormField';
import {uploadReceipt, receiptUrl} from './api';

const schema=z.object({title:z.string().trim().min(1,'Vui lòng nhập tiêu đề').max(200),category:z.string().trim().min(1,'Vui lòng chọn danh mục').max(100),amount:z.string().regex(/^[0-9]{1,19}$/,'Nhập số tiền VND nguyên lớn hơn 0').refine(v=>/^[0-9]+$/.test(v)&&BigInt(v)>0n,'Số tiền phải lớn hơn 0'),expenseDate:z.string().regex(/^(?!0000)\d{4}-\d{2}-\d{2}$/,'Nhập ngày hợp lệ trong năm 0001 đến 9999').refine(v=>{const d=new Date(v+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.getUTCFullYear()>=1&&d.getUTCFullYear()<=9999&&d.toISOString().slice(0,10)===v;},'Nhập ngày hợp lệ'),description:z.string().max(2000),proofReference:z.string().max(1000)});

export function ExpenseForm({campaignId,expense,onSaved,onCancel}:{campaignId:string;expense?:Expense;onSaved:()=>void;onCancel:()=>void}){
    useLanguage();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [receiptError, setReceiptError] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const form=useForm<ExpenseWrite>({defaultValues:{title:expense?.title||'',category:expense?.category||'',amount:expense?.amount||'',expenseDate:expense?.expenseDate||'',description:expense?.description||'',proofReference:expense?.proofReference||''}});
    const save=useSaveExpense(campaignId);

    const onSubmit = async (values: ExpenseWrite) => {
        const parsed = schema.safeParse(values);
        if (!parsed.success) {
            for (const issue of parsed.error.issues) form.setError(issue.path[0] as keyof ExpenseWrite, {message: issue.message});
            return;
        }
        try {
            setUploading(true);
            setReceiptError(null);
            const saved = await save.mutateAsync({values: parsed.data, expense});
            if (file) {
                await uploadReceipt(saved.id, file);
            }
            onSaved();
        } catch (error) {
            setReceiptError(errorMessage(error));
            for (const field of apiError(error)?.fieldErrors || []) {
                if (field.field in values) form.setError(field.field as keyof ExpenseWrite, {message: field.message});
            }
        } finally {
            setUploading(false);
        }
    };

    return <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <h2 className="text-xl font-semibold">{renderText(expense?tr("Chỉnh sửa chi phí chờ duyệt"):tr("Gửi chi phí"))}</h2>
        {renderText((['title','category','amount','expenseDate','description','proofReference'] as const).map(key=><FormField key={key} id={'expense-'+key} label={{title:tr("Tiêu đề"),category:tr("Danh mục"),amount:'Số tiền (VND)',expenseDate:tr("Ngày chi"),description:tr("Mô tả (tùy chọn)"),proofReference:tr("Tham chiếu chứng từ hoặc liên kết (tùy chọn)")}[key]} error={form.formState.errors[key]?.message}>
            {renderText(key==='description'?<textarea className="w-full rounded-lg border border-border bg-surface p-3" id={'expense-'+key} maxLength={2000} rows={3} {...form.register(key)}/>:<Input id={'expense-'+key} type={key==='expenseDate'?'date':'text'} inputMode={key==='amount'?'numeric':undefined} maxLength={{title:200,category:100,amount:19,expenseDate:10,description:2000,proofReference:1000}[key]} {...form.register(key)}/>)}</FormField>))}

        <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary" htmlFor="expense-receipt-file">
                {tr("Ảnh hóa đơn chứng từ (tùy chọn, tối đa 5MB)")}
            </label>
            <input
                ref={fileRef}
                id="expense-receipt-file"
                type="file"
                accept="image/*,application/pdf"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-primary-muted cursor-pointer"
            />
            {expense?.hasReceipt && (
                <div className="flex items-center gap-2 pt-1 text-xs text-text-secondary">
                    <span>{tr("Đã có hóa đơn đính kèm:")}</span>
                    <a className="font-medium text-primary hover:underline" href={receiptUrl(expense.id)} target="_blank" rel="noopener noreferrer">
                        {tr("Xem hóa đơn hiện tại")}
                    </a>
                </div>
            )}
        </div>

        {renderText((save.isError || receiptError) && <p role="alert" className="text-danger">{renderText(receiptError || errorMessage(save.error))}</p>)}
        <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={save.isPending || uploading}>
                {renderText((save.isPending || uploading) ? tr("Đang lưu…") : expense ? tr("Lưu chi phí") : tr("Gửi để xét duyệt"))}
            </Button>
            <Button disabled={save.isPending || uploading} onClick={onCancel}>{tr("Hủy")}</Button>
        </div>
    </form>;
}
