import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../auth/store';
import * as api from './api';
import type {ApplicationInput,ApplicationFilters} from './types';
export function useApplications(campaignId:string|undefined,filters:ApplicationFilters,mine=false){const{user,initialized}=useAuth();return useQuery({queryKey:['applications',user?.id,campaignId,mine,filters],queryFn:()=>api.applications(campaignId,filters,mine),enabled:initialized&&!!user});}
export function useRecruitmentSummary(campaignId:string){const{user,initialized}=useAuth();return useQuery({queryKey:['applications',user?.id,campaignId,'summary'],queryFn:()=>api.summary(campaignId),enabled:initialized&&!!user&&!!campaignId});}
function useRefreshApplications(){const client=useQueryClient();return async()=>{await Promise.all(['applications','coordination','dashboard'].map(key=>client.invalidateQueries({queryKey:[key]})));};}
export function useApply(campaignId:string){return useMutation({mutationFn:(input:ApplicationInput)=>api.apply(campaignId,input),onSuccess:useRefreshApplications()});}
export function useChangeApplication(){return useMutation({mutationFn:api.changeApplication,onSuccess:useRefreshApplications()});}
