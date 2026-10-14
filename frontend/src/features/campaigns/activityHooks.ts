import {useQuery} from '@tanstack/react-query';
import {useLanguage} from '../../shared/lib/i18n';
import {activityList, activityDetail} from './activityApi';
export function useActivityList(q = '', category = '') {
    const language = useLanguage(s => s.language);
    return useQuery({queryKey: ['activities', language, q, category], queryFn: () => activityList(language, q, category)});
}
export function useActivityDetail(id: string) {
    const language = useLanguage(s => s.language);
    return useQuery({queryKey: ['activity', id, language], queryFn: () => activityDetail(id, language)});
}
