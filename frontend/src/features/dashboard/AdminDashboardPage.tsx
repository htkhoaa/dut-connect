import {useLanguage,tr,renderText} from '../../shared/lib/i18n';
import {MetricGrid} from './MetricGrid';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';
import {useAdminDashboard} from './hooks';
import {Link} from 'react-router-dom';
import {PageHeader} from '../../shared/components/PageHeader';
import {Icon} from '../../shared/components/Icon';
export function AdminDashboardPage(){
 useLanguage();const query=useAdminDashboard();
 if(query.isPending)return <LoadingState/>;
 if(query.isError)return <ErrorState message={errorMessage(query.error)} onRetry={()=>void query.refetch()}/>;
 const d=query.data;
 return <div className="space-y-6"><PageHeader eyebrow={tr('TỔNG QUAN HỆ THỐNG')} title={tr('Cùng nhìn lại những đóng góp')} description={tr('Theo dõi chiến dịch, tổ chức và đăng ký tình nguyện.')} actions={<Button variant="secondary" disabled={query.isFetching} onClick={()=>void query.refetch()}>{tr('Làm mới tổng quan')}</Button>}/>
 <MetricGrid items={[[tr('Chiến dịch đang hoạt động'),d.activeCampaigns],[tr('Chiến dịch đã hoàn thành'),d.completedCampaigns],[tr('Đề xuất chờ duyệt'),d.pendingProposals],[tr('Tổ chức chờ xác minh'),d.pendingOrganizationVerifications],[tr('Tổ chức đã xác minh'),d.verifiedOrganizations],[tr('Sinh viên được chấp nhận'),d.uniqueAcceptedVolunteers]]}/>
 <Card><h2 className="mb-4 text-lg font-semibold">{tr('Lối tắt quản lý')}</h2><div className="grid gap-3 sm:grid-cols-2">{[['/admin/proposals','Duyệt đề xuất'],['/admin/organizations','Duyệt tổ chức'],['/admin/campaigns','Tất cả chiến dịch'],['/admin/users','Người dùng']].map(([to,label])=><Link key={to} to={to} className="ui-button ui-button-secondary justify-between">{renderText(tr(label))}<Icon name="arrow" size={17}/></Link>)}</div></Card></div>;
}
