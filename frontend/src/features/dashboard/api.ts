import {apiClient} from '../../shared/api/client';
import type {AdminDashboard,CampaignDashboard} from './types';
export async function adminDashboard(){return (await apiClient.get<AdminDashboard>('/admin/dashboard')).data;}
export async function campaignDashboard(id:string){return (await apiClient.get<CampaignDashboard>('/campaigns/'+id+'/dashboard')).data;}
