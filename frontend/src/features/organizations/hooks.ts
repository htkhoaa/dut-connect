import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import * as api from './api';
import {useAuth} from '../auth/store';
import type {OrganizationScope, OrganizationStatus, OrganizationPatch, AddMemberRequest, MemberChangeRequest, MemberVersionRequest, Moderation} from './types';

export function useOrganizations(scope: OrganizationScope, page: number, q: string, status: OrganizationStatus | '') {
    return useQuery({queryKey: ['organizations', scope, page, q, status], queryFn: () => api.listOrganizations(scope, page, q, status)});
}
export function useOrganization(id: string) {
    const {initialized, user} = useAuth();
    return useQuery({queryKey: ['organizations', id, user?.id || 'public'], queryFn: () => api.getOrganization(id), enabled: initialized});
}
export function useOrganizationTypes() {return useQuery({queryKey: ['organization-types'], queryFn: api.getOrganizationTypes});}
export function useOrganizationMembers(id: string, page: number) {return useQuery({queryKey: ['organizations', id, 'members', page], queryFn: () => api.getMembers(id, page)});}
function useRefreshOrganizations() {
    const client = useQueryClient();
    return () => Promise.all(['organizations', 'dashboard'].map(key => client.invalidateQueries({queryKey: [key]})));
}
export function useCreateOrganization() {return useMutation({mutationFn: api.createOrganization, onSuccess: useRefreshOrganizations()});}
export function useEditOrganization(id: string) {return useMutation({mutationFn: (values: OrganizationPatch) => api.editOrganization(id, values), onSuccess: useRefreshOrganizations()});}
export function useAddOrganizationMember(id: string) {return useMutation({mutationFn: (values: AddMemberRequest) => api.addMember(id, values), onSuccess: useRefreshOrganizations()});}
export function useChangeOrganizationMember(id: string) {return useMutation({mutationFn: (values: MemberChangeRequest) => api.changeMember(id, values), onSuccess: useRefreshOrganizations()});}
export function useRemoveOrganizationMember(id: string) {return useMutation({mutationFn: (values: MemberVersionRequest) => api.removeMember(id, values), onSuccess: useRefreshOrganizations()});}
export function useTransferOrganization(id: string) {return useMutation({mutationFn: (values: MemberVersionRequest) => api.transferOwnership(id, values), onSuccess: useRefreshOrganizations()});}
export function useModerateOrganization(id: string) {return useMutation({mutationFn: (values: {command: Moderation; version: number}) => api.moderateOrganization(id, values), onSuccess: useRefreshOrganizations()});}
