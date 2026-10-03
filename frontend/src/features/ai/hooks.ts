import {useMutation,useQuery} from '@tanstack/react-query';
import {useAuth} from '../auth/store';
import * as api from './api';

export function useAiAvailability(campaignId:string){
    const user=useAuth(s=>s.user);
    return useQuery({queryKey:['ai',user?.id,campaignId,'availability'],queryFn:()=>api.availability(campaignId),enabled:!!user&&!!campaignId});
}
export function useVolunteerMatches(campaignId:string){
    const user=useAuth(s=>s.user);
    return useMutation({mutationKey:['ai',user?.id,campaignId],mutationFn:(ids:string[]|undefined)=>api.match(campaignId,ids),retry:false});
}
