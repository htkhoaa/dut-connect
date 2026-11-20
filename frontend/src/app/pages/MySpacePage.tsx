import {Link} from 'react-router-dom';
import {PageHeader} from '../../shared/components/PageHeader';
import {tr, useLanguage} from '../../shared/lib/i18n';
import {useAuth} from '../../features/auth/store';

const groups = [
    {title: 'Tham gia và đóng góp', items: [
        ['/campaigns', 'Khám phá chiến dịch', 'Tìm hoạt động để tham gia hoặc quyên góp.'],
        ['/me/applications', 'Đăng ký của tôi', 'Theo dõi kết quả xét duyệt và đội tình nguyện.'],
        ['/me/donations', 'Quyên góp của tôi', 'Kiểm tra trạng thái các khoản đóng góp.'],
        ['/me/tasks', 'Nhiệm vụ của tôi', 'Xem công việc được giao và cập nhật tiến độ.'],
        ['/me/history', 'Lịch sử tham gia', 'Xem kết quả hoàn thành và số giờ đã xác minh.'],
    ]},
    {title: 'Tổ chức hoạt động', items: [
        ['/proposals/new', 'Tạo đề xuất', 'Chuẩn bị kế hoạch và gửi đề xuất để xét duyệt.'],
        ['/proposals', 'Đề xuất của tôi', 'Theo dõi đề xuất đang chờ duyệt hoặc cần bổ sung.'],
        ['/manage/campaigns', 'Chiến dịch tôi quản lý', 'Điều phối thành viên, nhiệm vụ, tài chính và báo cáo.'],
        ['/me/organizations', 'Tổ chức của tôi', 'Quản lý hồ sơ tổ chức và quyền đại diện.'],
    ]},
    {title: 'Tài khoản và trợ giúp', items: [
        ['/me/profile', 'Hồ sơ cá nhân', 'Cập nhật thông tin và kỹ năng của bạn.'],
        ['/me/settings', 'Cài đặt', 'Quản lý tùy chọn tài khoản.'],
        ['/guide', 'Hướng dẫn tham gia', 'Xem các bước tham gia, quyên góp và tạo chiến dịch.'],
    ]},
];
export function MySpacePage() {
    useLanguage();
    const user = useAuth(s => s.user);
    return <div className="space-y-8">
        <PageHeader title={tr('Không gian của tôi')} description={tr('Chọn việc bạn muốn làm. Các thông tin đăng ký, đóng góp và quản lý được tập trung tại đây.')}/>
        {user?.role === 'ADMIN' && <Link to="/admin" className="ui-button ui-button-secondary">{tr('Quản trị hệ thống')} →</Link>}
        {groups.map(group => <section key={group.title} className="space-y-3">
            <h2 className="text-xl font-bold">{tr(group.title)}</h2>
            <div className="grid gap-3 md:grid-cols-3">{group.items.map(([to, title, description]) => <Link key={to} to={to} className="rounded-2xl border border-border bg-surface p-5 transition hover:border-primary hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-primary">
                <h3 className="font-semibold text-primary">{tr(title)} <span aria-hidden="true">→</span></h3><p className="mt-2 text-sm text-text-secondary">{tr(description)}</p>
            </Link>)}</div>
        </section>)}
    </div>;
}
