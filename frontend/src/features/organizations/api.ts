import {apiClient} from '../../shared/api/client';
import type {PageResponse} from '../../shared/api/errors';
import type {OrganizationDetail, OrganizationSummary, OrganizationType, OrganizationMember, OrganizationValues,
    OrganizationPatch, OrganizationScope, OrganizationStatus, AddMemberRequest, MemberChangeRequest, MemberVersionRequest, Moderation} from './types';

export async function listOrganizations(scope: OrganizationScope, page: number, q: string, status: OrganizationStatus | '') {
    const path = scope === 'mine' ? '/me/organizations' : scope === 'admin' ? '/admin/organizations' : '/organizations';
    return (await apiClient.get<PageResponse<OrganizationSummary>>(path, {params: {page, size: 20, q, status: status || undefined}})).data;
}
export async function getOrganization(id: string) {return (await apiClient.get<OrganizationDetail>('/organizations/' + id)).data;}
export async function getOrganizationTypes() {return (await apiClient.get<PageResponse<OrganizationType>>('/organization-types', {params: {size: 100}})).data;}
export async function createOrganization(values: OrganizationValues) {return (await apiClient.post<OrganizationDetail>('/organizations', values)).data;}
export async function editOrganization(id: string, values: OrganizationPatch) {
    const {description, ...fields} = values;
    return (await apiClient.patch<OrganizationDetail>('/organizations/' + id, {...fields,
        ...(description.trim() ? {description, clearDescription: false} : {clearDescription: true})})).data;
}
export async function getMembers(id: string, page: number) {return (await apiClient.get<PageResponse<OrganizationMember>>('/organizations/' + id + '/members', {params: {page, size: 20}})).data;}
export async function addMember(id: string, values: AddMemberRequest) {return (await apiClient.post('/organizations/' + id + '/members', values)).data as {member: OrganizationMember; organizationVersion: number};}
export async function changeMember(id: string, {userId, ...body}: MemberChangeRequest) {return (await apiClient.patch<OrganizationDetail>('/organizations/' + id + '/members/' + userId, body)).data;}
export async function removeMember(id: string, {userId, version}: MemberVersionRequest) {await apiClient.delete('/organizations/' + id + '/members/' + userId, {params: {version}});}
export async function transferOwnership(id: string, body: MemberVersionRequest) {return (await apiClient.post<OrganizationDetail>('/organizations/' + id + '/transfer-ownership', body)).data;}
export async function moderateOrganization(id: string, body: {command: Moderation; version: number}) {return (await apiClient.post<OrganizationDetail>('/admin/organizations/' + id + '/' + body.command, {version: body.version})).data;}
