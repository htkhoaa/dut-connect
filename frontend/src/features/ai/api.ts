import {apiClient} from '../../shared/api/client';
import type {AiAvailability,MatchResponse} from './types';

export async function availability(campaignId:string):Promise<AiAvailability>{
    return (await apiClient.get<AiAvailability>('/campaigns/'+campaignId+'/ai/availability')).data;
}
export async function match(campaignId:string,applicationIds?:string[]):Promise<MatchResponse>{
    return (await apiClient.post<MatchResponse>('/campaigns/'+campaignId+'/ai/volunteer-matches',
        applicationIds?{applicationIds}:{},{timeout:80_000})).data;
}
