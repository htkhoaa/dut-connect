import {apiClient} from '../../shared/api/client';
import type {PageResponse} from '../../shared/api/errors';
import type {Language} from '../../shared/lib/i18n';
export interface PublishedActivity {
    id: string; title: string; summary: string; description: string; organizer: string;
    location: string; category: string; period: string; publishedOn: string; imageUrl: string; sourceUrl: string;
}
export async function activityList(lang: Language, q: string, category: string) {
    return (await apiClient.get<PageResponse<PublishedActivity>>('/activities', {params: {lang, q, category, size: 20}})).data;
}
export async function activityDetail(id: string, lang: Language) {
    return (await apiClient.get<PublishedActivity>('/activities/' + id, {params: {lang}})).data;
}
