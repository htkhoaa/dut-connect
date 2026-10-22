import {tr} from "../../shared/lib/i18n";
import {useLanguage, renderText} from "../../shared/lib/i18n";
import type {PublicExpense} from './types';
import {vnd} from '../campaigns/presentation';
import {localDate} from './presentation';
export function ExpenseDetails({expense:e}:{expense:Omit<PublicExpense,'approvedAt'>}){
    useLanguage();
    let url:string|undefined;
    if(e.proofReference){try{const parsed=new URL(e.proofReference);if(['https:','http:'].includes(parsed.protocol)&&!parsed.username&&!parsed.password)url=parsed.href;}catch{/* Proof references may be plain text. */}}
    return <div className="space-y-2 break-words"><h3 className="text-lg font-semibold">{renderText(e.title)}</h3><p>{renderText(e.category)} · {renderText(localDate(e.expenseDate))}</p><p className="font-semibold">{renderText(vnd(e.amount))}</p>{renderText(e.description&&<p className="whitespace-pre-wrap">{renderText(e.description)}</p>)}{renderText(e.proofReference&&<p>{tr("Chứng từ:")}{renderText(url?<a className="text-primary hover:underline" href={url} target="_blank" rel="noopener noreferrer">{renderText(e.proofReference)}</a>:e.proofReference)}</p>)}</div>;
}
