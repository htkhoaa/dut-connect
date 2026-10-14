import {useLanguage, tr, renderText, locale} from "../../shared/lib/i18n";
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
    useLanguage();
    const {id = ''} = useParams();
    const organization = useOrganization(id);
    const user = useAuth(state => state.user);
    const [reload, setReload] = useState(false);
    if (organization.isPending) return <LoadingState message={tr("Đang tải tổ chức…")}/>;
    if (organization.isError) return <ErrorState message={errorMessage(organization.error)} onRetry={() => void organization.refetch()}/>;
    const detail = organization.data;
    const summary = detail.organization;
    const photo = organizationPhoto(summary.name, summary.organizationTypeName);
    return <div className="space-y-6">
        <Link className="text-primary hover:underline" to="/organizations">{tr("Khám phá tổ chức")}</Link>
        <div className="organization-detail-photo"><img src={photo.src} alt={photo.alt}/></div>
        <div className="organization-heading"><span className="organization-mark"><Icon name="building" size={38}/></span><div className="min-w-0 flex-1"><p className="mb-2 text-sm text-primary">{renderText(catalogLabel(summary.organizationTypeName))}</p><h1 className="min-w-0 max-w-full break-words text-3xl font-bold">{renderText(displayName(summary.name))}</h1>{renderText(isDemoName(summary.name) && <p className="mt-2 text-xs text-text-secondary">{tr("Dữ liệu mẫu")}</p>)}</div>
            <Badge tone={organizationStatuses[summary.status].tone}>{renderText(organizationStatuses[summary.status].label)}</Badge>
            <Button variant="secondary" onClick={() => setReload(true)}>{tr("Tải lại tổ chức")}</Button>
        </div>
        <Card><h2 className="mb-4 text-xl font-semibold">{tr("Giới thiệu tổ chức")}</h2><div className="space-y-4">
            <p className="whitespace-pre-wrap break-words">{renderText(detail.description || tr("Chưa có mô tả."))}</p>
            <p className="text-sm text-text-secondary">{tr("Ngày tạo")}{renderText(new Date(summary.createdAt).toLocaleDateString(locale()))}{renderText(detail.verifiedAt && ` · Xác minh ${new Date(detail.verifiedAt).toLocaleDateString(locale())}`)}</p>
            {renderText(detail.ownRole && <p>{tr("Vai trò của bạn:")}{renderText(memberRoles[detail.ownRole])}</p>)}
            {renderText(detail.ownRole && <p role="status" className={detail.canRepresent ? 'text-success' : 'text-text-secondary'}>
                {renderText(detail.canRepresent ? tr("Bạn được quyền đại diện tổ chức đã xác minh này.") : tr("Bạn chưa được quyền đại diện. Tổ chức cần được xác minh và bạn cần là chủ sở hữu hoặc người quản lý."))}
            </p>)}
        </div></Card>
        {renderText(summary.status === 'VERIFIED' && <OrganizationCampaigns id={summary.id}/>)}
        {renderText(detail.canEdit && <Card><h2 className="mb-5 text-xl font-semibold">{tr("Chỉnh sửa tổ chức")}</h2><OrganizationForm key={summary.id} detail={detail}/></Card>)}
        {renderText((detail.ownRole || user?.role === 'ADMIN') && <Card><OrganizationMembers key={summary.id} detail={detail}/></Card>)}
        {renderText(user?.role === 'ADMIN' && <Card><OrganizationModeration key={summary.id} detail={detail}/></Card>)}
        <ConfirmDialog open={reload} title={tr("Tải lại tổ chức?")} message={tr("Các thay đổi chưa lưu sẽ bị mất.")}
                       confirmLabel={tr("Tải lại")} onClose={() => setReload(false)} onConfirm={() => window.location.reload()}/>
    </div>;
}
