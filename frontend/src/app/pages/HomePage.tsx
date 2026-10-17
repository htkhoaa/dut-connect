import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {Link} from 'react-router-dom';
import {dutPhotography} from '../../shared/lib/dutPhotography';
import {useCampaigns} from '../../features/campaigns/hooks';
import type {CampaignFilters} from '../../features/campaigns/types';
import {CampaignCard} from '../../features/campaigns/components/CampaignCard';
import {useOrganizations} from '../../features/organizations/hooks';
import {OrganizationCard} from '../../features/organizations/components/OrganizationCard';

import {useAuth} from '../../features/auth/store';
import {Card} from '../../shared/components/Card';
import {Icon, type IconName} from '../../shared/components/Icon';
import {LoadingState} from '../../shared/components/LoadingState';
import {EmptyState} from '../../shared/components/EmptyState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';
import {ActivityGallery} from '../../features/campaigns/ActivityGallery';
const filters: CampaignFilters = {page: 0, q: '', status: 'OPEN', categoryId: '', organizationId: '', contributionMode: '', sort: 'newest'};
const ways: {icon: IconName; title: string; description: string}[] = [
    {icon: 'users', title: 'Góp thời gian & kỹ năng', description: 'Mang kiến thức Bách khoa đến những nơi cần bạn, từ công nghệ đến hoạt động cộng đồng.'},
    {icon: 'heart', title: 'Tiếp sức những điều tốt', description: 'Tham gia chiến dịch bạn quan tâm, kết nối đội hình và cùng thực hiện hoạt động cộng đồng.'},
    {icon: 'shield', title: 'Minh bạch từng hành động', description: 'Tổ chức được xác minh, đăng ký được xét duyệt và điểm danh được ghi nhận theo từng buổi.'},
];
export function HomePage() {
    useLanguage();
    const campaigns = useCampaigns('public', filters);
    const organizations = useOrganizations('public', 0, '', '');
    const user = useAuth(s => s.user);
    const featured = campaigns.data?.items.slice(0, 6) || [];

    return <div className="landing-page">
        <section className="landing-hero">
            <div className="landing-hero-copy"><span className="hero-kicker"><span className="h-2 w-2 rounded-full bg-primary"/>{tr("Cộng đồng sinh viên Bách khoa Đà Nẵng")}</span>
                <h1>{tr("Từ Bách khoa,")}<br/><span className="text-primary">{tr("lan tỏa điều tốt.")}</span></h1>
                <p className="hero-description">{tr("Kết nối với những chiến dịch ý nghĩa. Góp thời gian, kỹ năng và sự sẻ chia để cùng tạo nên thay đổi.")}</p>
                <div className="mt-7 flex flex-wrap gap-3"><Link to="/campaigns" className="button-link">{tr("Khám phá chiến dịch")}<Icon name="arrow" size={18}/></Link><Link to="/organizations" className="ui-button ui-button-secondary">{tr("Gặp gỡ tổ chức")}</Link></div>
                <div className="hero-note"><span className="flex -space-x-2">{renderText(['D', 'U', 'T'].map(letter => <span key={letter} className="letter-avatar">{renderText(letter)}</span>))}</span><div><p className="text-sm font-semibold">{tr("Cùng nhau, chúng ta làm được nhiều hơn.")}</p><p className="mt-1 text-xs text-text-secondary">{tr("Một nền tảng · Nhiều cách để cống hiến")}</p></div></div>
            </div>
            <div className="landing-hero-art"><img src={dutPhotography.main.src} alt={dutPhotography.main.alt} fetchPriority="high"/><div className="floating-note"><span className="icon-tile"><Icon name="heart"/></span><div><strong>{tr("Mỗi đóng góp đều có ý nghĩa")}</strong><p>{tr("Bắt đầu từ một việc nhỏ hôm nay.")}</p></div><Icon name="spark" className="text-primary"/></div><div className="photo-pill"><Icon name="leaf" size={16}/>{tr("Tuổi trẻ Bách khoa · Sống có ích")}</div></div>
        </section>
        <section aria-label={tr("Cách đóng góp")} className="contribution-grid">{renderText(ways.map(item => <Card key={item.title} className="contribution-card"><span className="icon-tile"><Icon name={item.icon} size={24}/></span><div><h2 className="font-semibold">{renderText(item.title)}</h2><p className="mt-2 text-sm text-text-secondary">{renderText(item.description)}</p></div></Card>))}</section>
        <section><div className="section-heading"><div><p className="eyebrow text-primary">{tr("CÙNG HÀNH ĐỘNG")}</p><h2 className="mt-2">{tr("Một chiến dịch. Nhiều giá trị.")}</h2><p className="mt-2 text-text-secondary">{tr("Những hoạt động đang mở và chờ bạn góp sức.")}</p></div><Link to="/campaigns" className="ui-button ui-button-secondary">{tr("Xem tất cả")}<Icon name="arrow" size={17}/></Link></div>
            {renderText(campaigns.isPending ? <LoadingState/> : campaigns.isError ? <ErrorState message={errorMessage(campaigns.error)} onRetry={() => void campaigns.refetch()}/> : featured.length === 0 ? <EmptyState message={tr("Chưa có chiến dịch đang mở. Hãy quay lại để khám phá hoạt động mới.")}/> : <div className="campaign-grid">{renderText(featured.map(c => <CampaignCard key={c.id} campaign={c}    />))}</div>)}
        </section>
        <ActivityGallery/>
        <section className="community-banner"><div className="community-banner-art"><img src={dutPhotography.garden.src} alt={dutPhotography.garden.alt} loading="lazy"/></div><div className="community-banner-copy"><p className="eyebrow text-primary">{tr("TRI THỨC ĐỂ SẺ CHIA")}</p><h2>{tr("Điều bạn biết,")}<br/>{tr("có thể là điều ai đó cần.")}</h2><p>{tr("Dạy một buổi học, hỗ trợ một kỹ năng, cùng làm một dự án. Hãy tìm cách đóng góp phù hợp với bạn và để hành trình sinh viên trở nên ý nghĩa hơn.")}</p><Link to={user ? '/me/profile' : '/register'} className="button-link">{renderText(user ? tr("Hoàn thiện hồ sơ của bạn") : tr("Trở thành một phần cộng đồng"))}<Icon name="arrow" size={17}/></Link></div></section>
        <section><div className="section-heading"><div><p className="eyebrow text-primary">{tr("KẾT NỐI CÙNG NHAU")}</p><h2 className="mt-2">{tr("Những tổ chức cùng chung mục tiêu")}</h2><p className="mt-2 text-text-secondary">{tr("Đoàn, hội, câu lạc bộ và các đội sinh viên đã được xác minh.")}</p></div><Link to="/organizations" className="ui-button ui-button-secondary">{tr("Khám phá")}<Icon name="arrow" size={17}/></Link></div>
            {renderText(organizations.isPending ? <LoadingState/> : organizations.isError ? <ErrorState message={errorMessage(organizations.error)} onRetry={() => void organizations.refetch()}/> : organizations.data.items.length === 0 ? <EmptyState message={tr("Các tổ chức được xác minh sẽ xuất hiện tại đây.")}/> : <div className="campaign-grid">{renderText(organizations.data.items.slice(0, 3).map(o => <OrganizationCard key={o.id} organization={o}/>))}</div>)}
        </section>
        <section className="join-banner"><div><span className="eyebrow">{tr("BẮT ĐẦU TỪ HÔM NAY")}</span><h2>{tr("Sẵn sàng viết tiếp câu chuyện của bạn?")}</h2><p>{tr("Một lần đăng ký. Một hành trình đóng góp cùng cộng đồng DUT.")}</p></div><Link to={user ? '/campaigns' : '/register'} className="ui-button join-button">{renderText(user ? tr("Tìm chiến dịch phù hợp") : 'Tham gia DUT Connect')}<Icon name="arrow" size={18}/></Link></section>
    </div>;
}
