import {Link} from 'react-router-dom';
import {useAdminDashboard} from './hooks';
import {MetricGrid} from './MetricGrid';
import {vnd} from '../campaigns/presentation';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';
import {Icon} from '../../shared/components/Icon';
import {PageHeader} from '../../shared/components/PageHeader';
export function AdminDashboardPage(){
    const query=useAdminDashboard();
    if(query.isPending)return <LoadingState/>;
    if(query.isError)return <ErrorState message={errorMessage(query.error)} onRetry={()=>void query.refetch()}/>;
    const d=query.data;
    return <div className="space-y-6"><PageHeader eyebrow="TỔNG QUAN HỆ THỐNG" title="Cùng nhìn lại những đóng góp" description="Theo dõi hoạt động, việc cần xử lý và những giá trị cộng đồng đã được xác nhận." actions={<Button variant="secondary" disabled={query.isFetching} onClick={()=>void query.refetch()}>Làm mới tổng quan</Button>}/>
        <MetricGrid items={[
            ['Chiến dịch đang hoạt động',d.activeCampaigns],['Chiến dịch đã hoàn thành',d.completedCampaigns],['Đề xuất chờ duyệt',d.pendingProposals],
            ['Tổ chức chờ xác minh',d.pendingOrganizationVerifications],['Tổ chức đã xác minh',d.verifiedOrganizations],
            ['Sinh viên được chấp nhận',d.uniqueAcceptedVolunteers],['Giờ tình nguyện đã xác minh',d.verifiedVolunteerHours],
            ['Đóng góp đã xác nhận',vnd(d.successfulDonationVolume)],['Chiến dịch đang gây quỹ',d.activeFundraisingCampaigns],['Chi phí chờ duyệt',d.pendingExpenses]
        ]}/><p className="text-xs leading-relaxed text-text-secondary">Số liệu tích lũy toàn hệ thống. Chiến dịch hoạt động là chiến dịch đang triển khai. Gây quỹ gồm chiến dịch mở hoặc hoạt động chưa hết hạn. Giờ tình nguyện chỉ tính kết quả đã xác minh và khoản đóng góp chỉ tính thanh toán thành công.</p>
        <Card><h2 className="mb-4 text-lg font-semibold">Lối tắt quản lý</h2><div className="grid gap-3 sm:grid-cols-2">{[['/admin/proposals','Duyệt đề xuất'],['/admin/organizations','Duyệt tổ chức'],['/admin/expenses','Duyệt chi phí'],['/admin/campaigns','Tất cả chiến dịch']].map(([path,label])=><Link key={path} className="flex items-center justify-between rounded-xl border border-border p-4 text-sm font-medium hover:bg-primary-light" to={path}>{label}<Icon name="arrow" size={17}/></Link>)}</div></Card>
    </div>;
}
