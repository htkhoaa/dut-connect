import {apiClient} from '../../shared/api/client';
import type {PageResponse} from '../../shared/api/errors';
import type {VolunteerApplication,ApplicationInput,ApplicationFilters,ApplicationAction,RecruitmentSummary} from './types';
export async function applications(campaignId:string|undefined,filters:ApplicationFilters,mine=false){
    return (await apiClient.get<PageResponse<VolunteerApplication>>(mine?'/me/applications':'/campaigns/'+campaignId+'/applications',
        {params:{...filters,status:filters.status||undefined,track:filters.track||undefined,size:20,...(mine?{campaignId}: {})}})).data;
}
export async function apply(campaignId:string,input:ApplicationInput){return (await apiClient.post<VolunteerApplication>('/campaigns/'+campaignId+'/applications',input)).data;}
export async function changeApplication(action:ApplicationAction){const{id,command,...body}=action;return (await apiClient.post<VolunteerApplication>('/applications/'+id+'/'+command,body)).data;}
export async function summary(campaignId:string){return (await apiClient.get<RecruitmentSummary>('/campaigns/'+campaignId+'/applications/summary')).data;}
