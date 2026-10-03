import {useParams, Link} from 'react-router-dom';
import {useState} from 'react';
import {useOrganization} from './hooks';
import {organizationStatuses, memberRoles} from './presentation';
import {OrganizationForm} from './components/OrganizationForm';
import {OrganizationMembers} from './components/OrganizationMembers';
import {OrganizationModeration} from './components/OrganizationModeration';
import {useAuth} from '../auth/store';
import {errorMessage} from '../../shared/api/errors';
import {Card} from '../../shared/components/Card';
import {Badge} from '../../shared/components/Badge';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {Button} from '../../shared/components/Button';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {Icon} from '../../shared/components/Icon';
import {catalogLabel} from '../../shared/lib/catalogLabels';
import {OrganizationCampaigns} from './components/OrganizationCampaigns';
import {displayName, isDemoName} from '../../shared/lib/demoPresentation';
import {organizationPhoto} from './visuals';

export function OrganizationDetailPage() {
    const {id = ''} = useParams();
    const organization = useOrganization(id);
    const user = useAuth(state => state.user);
    const [reload, setReload] = useState(false);
    if (organization.isPending) return <LoadingState message="Đang tải tổ chức…"/>;
    if (organization.isError) return <ErrorState message={errorMessage(organization.error)} onRetry={() => void organization.refetch()}/>;
    const detail = organization.data;
    const summary = detail.organization;
    const photo = organizationPhoto(summary.name, summary.organizationTypeName);
    return <div className="space-y-6">
        <Link className="text-primary hover:underline" to="/organizations">Khám phá tổ chức</Link>
        <div className="organization-detail-photo"><img src={photo.src} alt={photo.alt}/><span className="art-label">Ảnh tư liệu DUT</span></div>
        <div className="organization-heading"><span className="organization-mark"><Icon name="building" size={38}/></span><div className="min-w-0 flex-1"><p className="mb-2 text-sm text-primary">{catalogLabel(summary.organizationTypeName)}</p><h1 className="min-w-0 max-w-full break-words text-3xl font-bold">{displayName(summary.name)}</h1>{isDemoName(summary.name) && <p className="mt-2 text-xs text-text-secondary">Dữ liệu mẫu</p>}</div>
            <Badge tone={organizationStatuses[summary.status].tone}>{organizationStatuses[summary.status].label}</Badge>
            <Button variant="secondary" onClick={() => setReload(true)}>Tải lại tổ chức</Button>
        </div>
        <Card><h2 className="mb-4 text-xl font-semibold">Giới thiệu tổ chức</h2><div className="space-y-4">
            <p className="whitespace-pre-wrap break-words">{detail.description || 'Chưa có mô tả.'}</p>
            <p className="text-sm text-text-secondary">Ngày tạo {new Date(summary.createdAt).toLocaleDateString('vi-VN')}{detail.verifiedAt && ` · Xác minh ${new Date(detail.verifiedAt).toLocaleDateString('vi-VN')}`}</p>
            {detail.ownRole && <p>Vai trò của bạn: {memberRoles[detail.ownRole]}</p>}
            {detail.ownRole && <p role="status" className={detail.canRepresent ? 'text-success' : 'text-text-secondary'}>
                {detail.canRepresent ? 'Bạn được quyền đại diện tổ chức đã xác minh này.' : 'Bạn chưa được quyền đại diện. Tổ chức cần được xác minh và bạn cần là chủ sở hữu hoặc người quản lý.'}
            </p>}
        </div></Card>
        {summary.status === 'VERIFIED' && <OrganizationCampaigns id={summary.id}/>}
        {detail.canEdit && <Card><h2 className="mb-5 text-xl font-semibold">Chỉnh sửa tổ chức</h2><OrganizationForm key={summary.id} detail={detail}/></Card>}
        {(detail.ownRole || user?.role === 'ADMIN') && <Card><OrganizationMembers key={summary.id} detail={detail}/></Card>}
        {user?.role === 'ADMIN' && <Card><OrganizationModeration key={summary.id} detail={detail}/></Card>}
        <ConfirmDialog open={reload} title="Tải lại tổ chức?" message="Các thay đổi chưa lưu sẽ bị mất."
                       confirmLabel="Tải lại" onClose={() => setReload(false)} onConfirm={() => window.location.reload()}/>
    </div>;
}
