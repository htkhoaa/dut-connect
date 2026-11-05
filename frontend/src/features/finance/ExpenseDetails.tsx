import {tr} from "../../shared/lib/i18n";
import {useLanguage, renderText} from "../../shared/lib/i18n";
import type {PublicExpense} from './types';
import {vnd} from '../campaigns/presentation';
import {localDate} from './presentation';
import {receiptUrl} from './api';

export function ExpenseDetails({expense:e}:{expense:Omit<PublicExpense,'approvedAt'> & {hasReceipt?: boolean}}){
    useLanguage();
    let url:string|undefined;
    if(e.proofReference){try{const parsed=new URL(e.proofReference);if(['https:','http:'].includes(parsed.protocol)&&!parsed.username&&!parsed.password)url=parsed.href;}catch{/* Proof references may be plain text. */}}
    return <div className="space-y-2 break-words">
        <h3 className="text-lg font-semibold">{renderText(e.title)}</h3>
        <p className="text-sm text-text-secondary">{renderText(e.category)} · {renderText(localDate(e.expenseDate))}</p>
        <p className="font-semibold text-primary">{renderText(vnd(e.amount))}</p>
        {renderText(e.description&&<p className="whitespace-pre-wrap text-sm">{renderText(e.description)}</p>)}
        {renderText(e.proofReference&&<p className="text-sm"><span className="text-text-secondary">{tr("Chứng từ: ")}</span>{renderText(url?<a className="font-medium text-primary hover:underline" href={url} target="_blank" rel="noopener noreferrer">{renderText(e.proofReference)}</a>:e.proofReference)}</p>)}
        {renderText(e.hasReceipt&&<div className="pt-1"><a className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-light" href={receiptUrl(e.id)} target="_blank" rel="noopener noreferrer">📄 {tr("Xem hóa đơn đính kèm")}</a></div>)}
    </div>;
}
