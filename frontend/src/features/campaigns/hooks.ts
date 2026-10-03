import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {useAuth} from '../auth/store';
import * as api from './api';
import type {CampaignFilters,PlanWrite,CampaignAction,TeamAction,SkillInput,CategoryWrite} from './types';
export function useCampaigns(scope:'public'|'mine'|'admin',filters:CampaignFilters){const {user,initialized}=useAuth();return useQuery({queryKey:['campaigns',scope,user?.id,filters],queryFn:()=>api.campaignList(scope,filters),enabled:initialized});}
export function useCampaign(id:string){const {user,initialized}=useAuth();return useQuery({queryKey:['campaigns',id,user?.id||'public'],queryFn:()=>api.campaignDetail(id),enabled:initialized&&!!id});}
export function useCategories(page:number,admin=false){return useQuery({queryKey:['categories',admin,page],queryFn:()=>api.categories(page,admin)});}
export function useCategoryCatalog(){return useQuery({queryKey:['categories','catalog'],queryFn:api.categoryCatalog});}
export function useOrganizationOptions(scope:'public'|'mine'){return useQuery({queryKey:['organization-options',scope],queryFn:()=>api.organizationOptions(scope)});}
export function useSkillCatalog(){return useQuery({queryKey:['skill-catalog'],queryFn:api.skillCatalog});}
export function useTeam(id:string,page:number){return useQuery({queryKey:['campaigns',id,'managers',page],queryFn:()=>api.team(id,page)});}
export function useRefreshCampaigns(){const client=useQueryClient();return async()=>{await Promise.all(['campaigns','proposals','categories','applications','coordination','finance','dashboard'].map(key=>client.invalidateQueries({queryKey:[key]})));};}
export function useEditCampaign(id:string){return useMutation({mutationFn:(values:PlanWrite)=>api.editCampaign(id,values),onSuccess:useRefreshCampaigns()});}
export function useTransitionCampaign(id:string){return useMutation({mutationFn:(values:CampaignAction)=>api.transitionCampaign(id,values),onSuccess:useRefreshCampaigns()});}
export function useChangeTeam(id:string){return useMutation({mutationFn:(action:TeamAction)=>api.changeTeam(id,action),onSuccess:useRefreshCampaigns()});}
export function useReplaceSkills(id:string){return useMutation({mutationFn:(values:{items:SkillInput[];version:number})=>api.replaceSkills(id,values.items,values.version),onSuccess:useRefreshCampaigns()});}
export function useSaveCategory(){return useMutation({mutationFn:({id,values}:{id?:string;values:CategoryWrite})=>api.saveCategory(id,values),onSuccess:useRefreshCampaigns()});}
