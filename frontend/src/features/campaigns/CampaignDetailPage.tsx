import {useParams, Link} from 'react-router-dom';
import {useCampaign} from './hooks';
import {campaignStatuses, modes} from './presentation';
import {campaignVisual, isDemoContent} from './visuals';
import {PlanContent} from './components/PlanContent';
import {catalogLabel} from '../../shared/lib/catalogLabels';
import {errorMessage} from '../../shared/api/errors';
import {Card} from '../../shared/components/Card';
import {Badge} from '../../shared/components/Badge';
import {Icon} from '../../shared/components/Icon';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {ApplyPanel} from '../volunteers/ApplyPanel';
import {DonationPanel} from '../donations/DonationPanel';
import {FinancialSummaryCard} from '../finance/FinancialSummaryCard';
import {PublicExpenses} from '../finance/PublicExpenses';
import {displayName} from '../../shared/lib/demoPresentation';
export function CampaignDetailPage() {
    const {id = ''} = useParams(); const query = useCampaign(id);
    if (query.isPending) return <LoadingState/>;
    if (query.isError) return <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()}/>;
    const c = query.data;
    return <div className="space-y-7"><Link className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-primary" to="/campaigns"><span aria-hidden="true">←</span>Khám phá chiến dịch</Link>
        <section className="detail-hero"><img src={campaignVisual(c.categoryName, c.content.title).image} alt={campaignVisual(c.categoryName, c.content.title).alt}/><div className="detail-hero-shade"/><span className="art-label">Ảnh tư liệu DUT</span><div className="detail-hero-copy"><div className="mb-4 flex flex-wrap gap-2"><Badge tone={campaignStatuses[c.status].tone}>{campaignStatuses[c.status].label}</Badge><span className="detail-tag">{catalogLabel(c.categoryName)}</span>{isDemoContent(c.content.description) && <span className="detail-tag">Dữ liệu mẫu</span>}</div><h1>{displayName(c.content.title)}</h1><p className="mt-3 max-w-2xl text-sm text-white/85">{c.content.summary}</p><p className="mt-5 flex items-center gap-2 text-sm"><Icon name="building" size={17}/>{displayName(c.organizerName)}</p></div></section>
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-2 text-sm text-text-secondary"><Icon name="users" size={17}/>{modes[c.content.contributionMode]}<span className="mx-1">·</span>Liên hệ: {c.primaryContactName}</p>{(c.canManage || c.ownRole) && <Link className="ui-button ui-button-secondary" to={'/manage/campaigns/' + c.id}><Icon name="grid" size={17}/>Quản lý chiến dịch</Link>}</div>
        <div className="detail-grid"><div className="min-w-0 space-y-6"><Card><h2 className="mb-5 text-xl font-semibold">Về chiến dịch</h2><PlanContent content={c.content} organizerName={c.organizerName} categoryName={c.categoryName}/></Card>
            <Card><h2 className="mb-4 text-xl font-semibold">Kỹ năng cần có</h2>{c.skills.length ? <div className="flex flex-wrap gap-3">{c.skills.map(s => <div key={s.skillId + s.track} className="rounded-xl border border-border bg-surface-muted px-4 py-3"><p className="text-sm font-semibold">{catalogLabel(s.name)}</p><p className="mt-1 text-xs text-text-secondary">{s.track === 'TECHNICAL' ? 'Kỹ thuật' : 'Hậu cần'} · Mức quan trọng {s.importance}/5</p></div>)}</div> : <p className="text-sm text-text-secondary">Chưa có yêu cầu kỹ năng cụ thể.</p>}</Card>
            <FinancialSummaryCard campaignId={c.id}/><PublicExpenses campaignId={c.id}/>
        </div><aside className="min-w-0 space-y-5">{c.content.contributionMode !== 'DONATION_ONLY' && <ApplyPanel key={c.id} campaign={c}/>}<DonationPanel key={'donation-' + c.id} campaign={c}/><div className="rounded-2xl border border-primary-muted bg-primary-light p-5"><Icon name="shield" className="mb-3 text-primary"/><h2 className="text-sm font-semibold">Đóng góp có trách nhiệm</h2><p className="mt-2 text-sm text-text-secondary">Đăng ký sẽ được ban tổ chức xét duyệt. Các khoản đóng góp được xác nhận qua hệ thống và chi phí được công khai sau khi duyệt.</p></div></aside></div>
    </div>;
}
