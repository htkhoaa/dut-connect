import {apiClient} from '../../shared/api/client';
import type {PageResponse} from '../../shared/api/errors';
import type {Expense,PublicExpense,FinancialSummary,FundraisingProgress,ExpenseStatus,ExpenseWrite,ExpenseReview} from './types';
export async function summary(id:string){return (await apiClient.get<FinancialSummary>(`/campaigns/${id}/financial-summary`)).data;}
export async function progress(ids:string[]){return (await apiClient.get<FundraisingProgress[]>('/campaigns/fundraising-progress',{params:{campaignIds:ids.join(',')}})).data;}
export async function approved(id:string,page:number){return (await apiClient.get<PageResponse<PublicExpense>>(`/campaigns/${id}/expenses`,{params:{page,size:20}})).data;}
export async function expenses(id:string|undefined,status:ExpenseStatus|'',page:number){return (await apiClient.get<PageResponse<Expense>>(id?`/campaigns/${id}/management/expenses`:'/admin/expenses',{params:{status:status||undefined,page,size:20}})).data;}
export async function save(campaign:string,values:ExpenseWrite,expense?:Expense){
    const body={...values,...(expense?{version:expense.version,clearFields:(['description','proofReference'] as const).filter(key=>!values[key].trim())}:{})};
    return expense?(await apiClient.patch<Expense>(`/expenses/${expense.id}`,body)).data:(await apiClient.post<Expense>(`/campaigns/${campaign}/expenses`,body)).data;
}
export async function review({id,command,...body}:ExpenseReview){return (await apiClient.post<Expense>(`/admin/expenses/${id}/${command}`,body)).data;}
export async function uploadReceipt(id: string, file: File) {
    const data = new FormData();
    data.append('file', file);
    return (await apiClient.put(`/expenses/${id}/receipt`, data, {headers: {'Content-Type': 'multipart/form-data'}})).data;
}
export async function deleteReceipt(id: string) {
    return (await apiClient.delete(`/expenses/${id}/receipt`)).data;
}
export function receiptUrl(id: string) {
    return `/api/v1/expenses/${id}/receipt`;
}
