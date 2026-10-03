import {apiClient} from '../../shared/api/client';
import type {PageResponse} from '../../shared/api/errors';
import type {CampaignSummary,CampaignDetail,CampaignFilters,Category,CategoryWrite,PlanWrite,CampaignAction,Manager,TeamAction,SkillInput,SkillOption,OrganizationOption} from './types';
export async function campaignList(scope:'public'|'mine'|'admin',filters:CampaignFilters) {
    return (await apiClient.get<PageResponse<CampaignSummary>>(scope==='mine'?'/me/campaigns':scope==='admin'?'/admin/campaigns':'/campaigns',{params:{...filters,size:20,status:filters.status||undefined,categoryId:filters.categoryId||undefined,organizationId:filters.organizationId||undefined,contributionMode:filters.contributionMode||undefined}})).data;
}
export async function campaignDetail(id:string) {return (await apiClient.get<CampaignDetail>('/campaigns/'+id)).data;}
export async function editCampaign(id:string,values:PlanWrite) {return (await apiClient.patch<CampaignDetail>('/campaigns/'+id,{...values,clearFields:Object.entries(values.content).filter(([,value])=>value===null).map(([key])=>key)})).data;}
export async function transitionCampaign(id:string,{command,...body}:CampaignAction) {return (await apiClient.post<CampaignDetail>('/campaigns/'+id+'/'+command,body)).data;}
export async function categories(page:number,admin=false) {return (await apiClient.get<PageResponse<Category>>(admin?'/admin/campaign-categories':'/campaign-categories',{params:{page,size:20}})).data;}
export async function categoryCatalog() {
    const items:Category[]=[];let page=0;
    while(true){const result=await categories(page++);items.push(...result.items);if(!result.hasNext)return items;}
}
export async function saveCategory(id:string|undefined,values:CategoryWrite) {
    const {description,...rest}=values;const body={...rest,...(description.trim()?{description}:{clearDescription:true})};
    return id?(await apiClient.patch<Category>('/admin/campaign-categories/'+id,body)).data:(await apiClient.post<Category>('/admin/campaign-categories',body)).data;
}
export async function organizationOptions(scope:'public'|'mine') {
    const items:OrganizationOption[]=[];let page=0;
    while(true){const result=(await apiClient.get<PageResponse<OrganizationOption>>(scope==='mine'?'/me/organizations':'/organizations',{params:{page:page++,size:100}})).data;items.push(...result.items.filter(o=>o.status==='VERIFIED'));if(!result.hasNext)return items;}
}
export async function team(id:string,page:number) {return (await apiClient.get<PageResponse<Manager>>('/campaigns/'+id+'/managers',{params:{page,size:20}})).data;}
export async function changeTeam(id:string,action:TeamAction) {
    if(action.command==='add')return (await apiClient.post<CampaignDetail>('/campaigns/'+id+'/managers',{studentId:action.studentId,version:action.version})).data;
    await apiClient.delete('/campaigns/'+id+'/managers/'+action.userId,{params:{version:action.version}});
}
export async function skillCatalog() {
    const items:SkillOption[]=[];let page=0;
    while(true){const result=(await apiClient.get<PageResponse<SkillOption>>('/skills',{params:{page:page++,size:100}})).data;items.push(...result.items);if(!result.hasNext)return items;}
}
export async function replaceSkills(id:string,items:SkillInput[],version:number) {return (await apiClient.put<CampaignDetail>('/campaigns/'+id+'/skill-requirements',{items,version})).data;}
