import {useQuery,useMutation} from '@tanstack/react-query';
import {useAuth} from '../auth/store';
import {useRefreshCampaigns} from '../campaigns/hooks';
import type {ProposalStatus,PlanWrite,ReviewAction} from '../campaigns/types';
import * as api from './api';
export function useProposals(admin:boolean,page:number,q:string,status:ProposalStatus|''){const user=useAuth(s=>s.user);return useQuery({queryKey:['proposals',admin,user?.id,page,q,status],queryFn:()=>api.proposalList(admin,page,q,status)});}
export function useProposal(id:string){const user=useAuth(s=>s.user);return useQuery({queryKey:['proposals',id,user?.id],queryFn:()=>api.proposalDetail(id)});}
export function useSaveProposal(id?:string){return useMutation({mutationFn:(values:PlanWrite)=>api.saveProposal(id,values),onSuccess:useRefreshCampaigns()});}
export function useReviewProposal(id:string){return useMutation({mutationFn:(values:ReviewAction)=>api.reviewProposal(id,values),onSuccess:useRefreshCampaigns()});}
