import type {PublicExpense} from './types';
import {vnd} from '../campaigns/presentation';
import {localDate} from './presentation';
export function ExpenseDetails({expense:e}:{expense:Omit<PublicExpense,'approvedAt'>}){
    let url:string|undefined;
    if(e.proofReference){try{const parsed=new URL(e.proofReference);if(['https:','http:'].includes(parsed.protocol)&&!parsed.username&&!parsed.password)url=parsed.href;}catch{/* Proof references may be plain text. */}}
    return <div className="space-y-2 break-words"><h3 className="text-lg font-semibold">{e.title}</h3><p>{e.category} · {localDate(e.expenseDate)}</p><p className="font-semibold">{vnd(e.amount)}</p>{e.description&&<p className="whitespace-pre-wrap">{e.description}</p>}{e.proofReference&&<p>Chứng từ: {url?<a className="text-primary hover:underline" href={url} target="_blank" rel="noopener noreferrer">{e.proofReference}</a>:e.proofReference}</p>}</div>;
}
