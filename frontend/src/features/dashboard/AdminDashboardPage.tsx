import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
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
    useLanguage();
    const query=useAdminDashboard();
    if(query.isPending)return <LoadingState/>;
    if(query.isError)return <ErrorState message={errorMessage(query.error)} onRetry={()=>void query.refetch()}/>;
    const d=query.data;
    return <div className="space-y-6"><PageHeader eyebrow={tr("TỔNG QUAN HỆ THỐNG")} title={tr("Cùng nhìn lại những đóng góp")} description={tr("Theo dõi hoạt động, việc cần xử lý và những giá trị cộng đồng đã được xác nhận.")} actions={<Button variant="secondary" disabled={query.isFetching} onClick={()=>void query.refetch()}>{tr("Làm mới tổng quan")}</Button>}/>
        <MetricGrid items={[
            [tr("Chiến dịch đang hoạt động"),d.activeCampaigns],[tr("Chiến dịch đã hoàn thành"),d.completedCampaigns],[tr("Đề xuất chờ duyệt"),d.pendingProposals],
            [tr("Tổ chức chờ xác minh"),d.pendingOrganizationVerifications],[tr("Tổ chức đã xác minh"),d.verifiedOrganizations],
            [tr("Sinh viên được chấp nhận"),d.uniqueAcceptedVolunteers],[tr("Giờ tình nguyện đã xác minh"),d.verifiedVolunteerHours],
            [tr("Đóng góp đã xác nhận"),vnd(d.successfulDonationVolume)],[tr("Chiến dịch đang gây quỹ"),d.activeFundraisingCampaigns],[tr("Chi phí chờ duyệt"),d.pendingExpenses]
        ]}/><p className="text-xs leading-relaxed text-text-secondary">{tr("Số liệu tích lũy toàn hệ thống. Chiến dịch hoạt động là chiến dịch đang triển khai. Gây quỹ gồm chiến dịch mở hoặc hoạt động chưa hết hạn. Giờ tình nguyện chỉ tính kết quả đã xác minh và khoản đóng góp chỉ tính thanh toán thành công.")}</p>
        <Card><h2 className="mb-4 text-lg font-semibold">{tr("Lối tắt quản lý")}</h2><div className="grid gap-3 sm:grid-cols-2">{renderText([['/admin/proposals',tr("Duyệt đề xuất")],['/admin/organizations','Duyệt tổ chức'],['/admin/expenses',tr("Duyệt chi phí")],['/admin/campaigns',tr("Tất cả chiến dịch")]].map(([path,label])=><Link key={path} className="flex items-center justify-between rounded-xl border border-border p-4 text-sm font-medium hover:bg-primary-light" to={path}>{renderText(label)}<Icon name="arrow" size={17}/></Link>))}</div></Card>
    </div>;
}
