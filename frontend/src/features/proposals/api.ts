import {apiClient} from '../../shared/api/client';
import type {PageResponse} from '../../shared/api/errors';
import type {ProposalDetail,ProposalSummary,ProposalStatus,PlanWrite,ReviewAction,CampaignDetail} from '../campaigns/types';
export async function proposalList(admin:boolean,page:number,q:string,status:ProposalStatus|'') {return (await apiClient.get<PageResponse<ProposalSummary>>(admin?'/admin/proposals':'/proposals/mine',{params:{page,size:20,q,status:status||undefined}})).data;}
export async function proposalDetail(id:string) {return (await apiClient.get<ProposalDetail>('/proposals/'+id)).data;}
export async function saveProposal(id:string|undefined,values:PlanWrite) {
    return id?(await apiClient.patch<ProposalDetail>('/proposals/'+id,{...values,clearFields:Object.entries(values.content).filter(([,value])=>value===null).map(([key])=>key)})).data:(await apiClient.post<ProposalDetail>('/proposals',{content:values.content})).data;
}
export async function reviewProposal(id:string,action:ReviewAction) {
    const {command,...body}=action;
    return command==='approve'?(await apiClient.post<CampaignDetail>('/admin/proposals/'+id+'/approve',body)).data:(await apiClient.post<ProposalDetail>('/admin/proposals/'+id+'/reject',body)).data;
}
