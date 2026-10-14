import {Link, useParams} from 'react-router-dom';
import {useLanguage, tr, locale} from '../../shared/lib/i18n';
import {useActivityList, useActivityDetail} from './activityHooks';
import {Badge} from '../../shared/components/Badge';
import {Icon} from '../../shared/components/Icon';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {EmptyState} from '../../shared/components/EmptyState';
import {errorMessage} from '../../shared/api/errors';
const categories: Record<string,string> = {'environment':'Môi trường','community-support':'Hỗ trợ cộng đồng','education':'Giáo dục'};
export function ActivityGallery({q = '', category = ''}: {q?: string; category?: string}) {
    useLanguage();
    const activities = useActivityList(q, category);
    return <section className="space-y-6"><div className="section-heading"><div><p className="eyebrow text-primary">{tr('Hoạt động đã diễn ra')}</p><h2>{tr('Hồ sơ hoạt động thực tế')}</h2></div></div>
        {activities.isPending ? <LoadingState/> : activities.isError ? <ErrorState message={errorMessage(activities.error)} onRetry={() => void activities.refetch()}/> : activities.data.items.length === 0 ? <EmptyState message={tr('Chưa tìm thấy hoạt động phù hợp.')}/> :
        <div className="campaign-grid">{activities.data.items.map(a => <article key={a.id} className="campaign-card activity-card flex flex-col">
            <Link to={'/activities/'+a.id} className="campaign-cover" tabIndex={-1} aria-hidden="true"><img src={a.imageUrl} alt="" loading="lazy"/><span className="cover-badge"><Badge tone="success">{tr('Đã hoàn thành')}</Badge></span></Link>
            <div className="flex flex-1 flex-col p-5"><p className="mb-3 text-xs font-semibold text-primary">{tr(categories[a.category] || a.category)}</p><h3 className="mb-3 text-lg font-bold"><Link to={'/activities/'+a.id}>{a.title}</Link></h3><p className="mb-4 text-sm leading-relaxed text-text-secondary">{a.summary}</p>
                <p className="mb-3 flex gap-2 text-xs text-text-secondary"><Icon name="building" size={15}/>{a.organizer}</p><p className="mb-5 flex gap-2 text-xs text-text-secondary"><Icon name="calendar" size={15}/>{a.period}</p>
                <Link to={'/activities/'+a.id} className="mt-auto flex items-center justify-between border-t border-border pt-4 text-sm font-semibold text-primary">{tr('Xem chi tiết')}<Icon name="arrow" size={16}/></Link>
            </div></article>)}</div>}
    </section>;
}
export function ActivityDetailPage() {
    useLanguage();
    const {id = ''} = useParams(); const activity = useActivityDetail(id);
    if (activity.isPending) return <LoadingState/>;
    if (activity.isError) return <ErrorState message={errorMessage(activity.error)} onRetry={() => void activity.refetch()}/>;
    const a = activity.data;
    return <div className="space-y-6"><Link className="text-primary" to="/campaigns">{tr('Khám phá chiến dịch')}</Link>
        <section className="detail-hero"><img src={a.imageUrl} alt={a.title}/><div className="detail-hero-shade"/><div className="detail-hero-copy"><Badge tone="success">{tr('Đã hoàn thành')}</Badge><h1 className="mt-4">{a.title}</h1><p className="mt-3">{a.summary}</p></div></section>
        <div className="detail-grid"><article className="ui-card space-y-5"><h2 className="text-xl font-semibold">{tr('Về hoạt động')}</h2><p className="whitespace-pre-wrap leading-8">{a.description}</p>
            <a className="inline-flex items-center gap-2 text-primary hover:underline" href={a.sourceUrl} target="_blank" rel="noreferrer">{tr('Đọc bài gốc trên website DUT')}<Icon name="arrow" size={16}/></a></article>
            <aside className="ui-card space-y-5"><div><p className="text-sm text-text-secondary">{tr('Đơn vị tổ chức')}</p><p className="mt-1 font-semibold">{a.organizer}</p></div><div><p className="text-sm text-text-secondary">{tr('Địa điểm')}</p><p className="mt-1">{a.location}</p></div><div><p className="text-sm text-text-secondary">{tr('Thời gian')}</p><p className="mt-1">{a.period}</p></div><div><p className="text-sm text-text-secondary">{tr('Ngày công bố')}</p><p className="mt-1">{new Date(a.publishedOn+'T00:00:00').toLocaleDateString(locale())}</p></div></aside>
        </div></div>;
}
