import {useQuery} from '@tanstack/react-query';
import {useAuth} from '../auth/store';
import * as api from './api';
export function useAdminDashboard(){const {user,initialized}=useAuth();return useQuery({queryKey:['dashboard',user?.id,'admin'],queryFn:api.adminDashboard,enabled:initialized&&user?.role==='ADMIN',refetchOnWindowFocus:true});}
export function useCampaignDashboard(id:string){const {user,initialized}=useAuth();return useQuery({queryKey:['dashboard',user?.id,'campaign',id],queryFn:()=>api.campaignDashboard(id),enabled:initialized&&!!user&&!!id,refetchOnWindowFocus:true});}
