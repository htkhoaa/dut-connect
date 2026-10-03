import {Link} from 'react-router-dom';
import {dutPhotography} from '../../shared/lib/dutPhotography';
import {useCampaigns} from '../../features/campaigns/hooks';
import type {CampaignFilters} from '../../features/campaigns/types';
import {CampaignCard} from '../../features/campaigns/components/CampaignCard';
import {useOrganizations} from '../../features/organizations/hooks';
import {OrganizationCard} from '../../features/organizations/components/OrganizationCard';
import {useFundraisingProgress} from '../../features/finance/hooks';
import {useAuth} from '../../features/auth/store';
import {Card} from '../../shared/components/Card';
import {Icon, type IconName} from '../../shared/components/Icon';
import {LoadingState} from '../../shared/components/LoadingState';
import {EmptyState} from '../../shared/components/EmptyState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';
const filters: CampaignFilters = {page: 0, q: '', status: 'OPEN', categoryId: '', organizationId: '', contributionMode: '', sort: 'newest'};
const ways: {icon: IconName; title: string; description: string}[] = [
    {icon: 'users', title: 'Góp thời gian & kỹ năng', description: 'Mang kiến thức Bách khoa đến những nơi cần bạn, từ công nghệ đến hoạt động cộng đồng.'},
    {icon: 'heart', title: 'Tiếp sức những điều tốt', description: 'Ủng hộ chiến dịch bạn quan tâm, theo dõi tiến độ gây quỹ và đóng góp đã được xác nhận.'},
    {icon: 'shield', title: 'Minh bạch từng hành động', description: 'Tổ chức được xác minh, chi phí được duyệt và quá trình tham gia được ghi nhận rõ ràng.'},
];
export function HomePage() {
    const campaigns = useCampaigns('public', filters);
    const organizations = useOrganizations('public', 0, '', '');
    const user = useAuth(s => s.user);
    const featured = campaigns.data?.items.slice(0, 6) || [];
    const progress = useFundraisingProgress(featured.filter(c => c.contributionMode !== 'VOLUNTEER_ONLY').map(c => c.id));
    return <div className="landing-page">
        <section className="landing-hero">
            <div className="landing-hero-copy"><span className="hero-kicker"><span className="h-2 w-2 rounded-full bg-primary"/> Cộng đồng sinh viên Bách khoa Đà Nẵng</span>
                <h1>Từ Bách khoa,<br/><span className="text-primary">lan tỏa điều tốt.</span></h1>
                <p className="hero-description">Kết nối với những chiến dịch ý nghĩa. Góp thời gian, kỹ năng và sự sẻ chia để cùng tạo nên thay đổi.</p>
                <div className="mt-7 flex flex-wrap gap-3"><Link to="/campaigns" className="button-link">Khám phá chiến dịch <Icon name="arrow" size={18}/></Link><Link to="/organizations" className="ui-button ui-button-secondary">Gặp gỡ tổ chức</Link></div>
                <div className="hero-note"><span className="flex -space-x-2">{['D', 'U', 'T'].map(letter => <span key={letter} className="letter-avatar">{letter}</span>)}</span><div><p className="text-sm font-semibold">Cùng nhau, chúng ta làm được nhiều hơn.</p><p className="mt-1 text-xs text-text-secondary">Một nền tảng · Nhiều cách để cống hiến</p></div></div>
            </div>
            <div className="landing-hero-art"><img src={dutPhotography.main.src} alt={dutPhotography.main.alt} fetchPriority="high"/><span className="art-label">Ảnh khuôn viên DUT</span><div className="floating-note"><span className="icon-tile"><Icon name="heart"/></span><div><strong>Mỗi đóng góp đều có ý nghĩa</strong><p>Bắt đầu từ một việc nhỏ hôm nay.</p></div><Icon name="spark" className="text-primary"/></div><div className="photo-pill"><Icon name="leaf" size={16}/> Tuổi trẻ Bách khoa · Sống có ích</div></div>
        </section>
        <section aria-label="Cách đóng góp" className="contribution-grid">{ways.map(item => <Card key={item.title} className="contribution-card"><span className="icon-tile"><Icon name={item.icon} size={24}/></span><div><h2 className="font-semibold">{item.title}</h2><p className="mt-2 text-sm text-text-secondary">{item.description}</p></div></Card>)}</section>
        <section><div className="section-heading"><div><p className="eyebrow text-primary">CÙNG HÀNH ĐỘNG</p><h2 className="mt-2">Một chiến dịch. Nhiều giá trị.</h2><p className="mt-2 text-text-secondary">Những hoạt động đang mở và chờ bạn góp sức.</p></div><Link to="/campaigns" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">Xem tất cả <Icon name="arrow" size={17}/></Link></div>
            {campaigns.isPending ? <LoadingState/> : campaigns.isError ? <ErrorState message={errorMessage(campaigns.error)} onRetry={() => void campaigns.refetch()}/> : featured.length === 0 ? <EmptyState message="Chưa có chiến dịch đang mở. Hãy quay lại để khám phá hoạt động mới."/> : <div className="campaign-grid">{featured.map(c => <CampaignCard key={c.id} campaign={c} progress={progress.data?.find(p => p.campaignId === c.id)} financialPending={progress.isPending} financialError={progress.isError} onRetry={() => void progress.refetch()}/>)}</div>}
        </section>
        <section className="community-banner"><div className="community-banner-art"><img src={dutPhotography.garden.src} alt={dutPhotography.garden.alt} loading="lazy"/><span className="art-label">Ảnh khuôn viên DUT</span></div><div className="community-banner-copy"><p className="eyebrow text-primary">TRI THỨC ĐỂ SẺ CHIA</p><h2>Điều bạn biết,<br/>có thể là điều ai đó cần.</h2><p>Dạy một buổi học, hỗ trợ một kỹ năng, cùng làm một dự án. Hãy tìm cách đóng góp phù hợp với bạn và để hành trình sinh viên trở nên ý nghĩa hơn.</p><Link to={user ? '/me/profile' : '/register'} className="button-link">{user ? 'Hoàn thiện hồ sơ của bạn' : 'Trở thành một phần cộng đồng'}<Icon name="arrow" size={17}/></Link></div></section>
        <section><div className="section-heading"><div><p className="eyebrow text-primary">KẾT NỐI CÙNG NHAU</p><h2 className="mt-2">Những tổ chức cùng chung mục tiêu</h2><p className="mt-2 text-text-secondary">Đoàn, hội, câu lạc bộ và các đội sinh viên đã được xác minh.</p></div><Link to="/organizations" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">Khám phá <Icon name="arrow" size={17}/></Link></div>
            {organizations.isPending ? <LoadingState/> : organizations.isError ? <ErrorState message={errorMessage(organizations.error)} onRetry={() => void organizations.refetch()}/> : organizations.data.items.length === 0 ? <EmptyState message="Các tổ chức được xác minh sẽ xuất hiện tại đây."/> : <div className="campaign-grid">{organizations.data.items.slice(0, 3).map(o => <OrganizationCard key={o.id} organization={o}/>)}</div>}
        </section>
        <section className="join-banner"><div><span className="eyebrow">BẮT ĐẦU TỪ HÔM NAY</span><h2>Sẵn sàng viết tiếp câu chuyện của bạn?</h2><p>Một lần đăng ký. Một hành trình đóng góp cùng cộng đồng DUT.</p></div><Link to={user ? '/campaigns' : '/register'} className="ui-button join-button">{user ? 'Tìm chiến dịch phù hợp' : 'Tham gia DUT Connect'}<Icon name="arrow" size={18}/></Link></section>
    </div>;
}
