import {apiClient} from '../../shared/api/client';
import type {PageResponse} from '../../shared/api/errors';
import type {Profile, ProfileRequest, Skill, SkillsRequest} from './types';

export async function getProfile() {
    return (await apiClient.get<Profile>('/me/profile')).data;
}

export async function getSkills() {
    return (await apiClient.get<PageResponse<Skill>>('/skills', {params: {size: 100}})).data;
}

export async function updateProfile(values: ProfileRequest) {
    return (await apiClient.put<Profile>('/me/profile', values)).data;
}

export async function updateSkills(values: SkillsRequest) {
    return (await apiClient.put<Profile>('/me/skills', values)).data;
}
