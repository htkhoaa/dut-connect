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
import {catalogLabel} from '../../shared/lib/catalogLabels';
import {OrganizationCampaigns} from './components/OrganizationCampaigns';
import {displayName, isDemoName} from '../../shared/lib/demoPresentation';
import {organizationPhoto, organizationLogo} from './visuals';

function cleanDescription(raw?: string | null): string {
    if (!raw) return "";
    return raw.split('\n\n').filter(p =>
        !p.includes("Nguồn hoạt động:") &&
        !p.includes("Hồ sơ phục vụ") &&
        !p.includes("https://dut.udn.vn")
    ).join('\n\n');
}

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
    const logo = organizationLogo(summary.name, summary.organizationTypeName);
    const desc = cleanDescription(detail.description);

    return <div className="space-y-6">
        <Link className="ui-button ui-button-secondary" to="/organizations">{tr("Khám phá tổ chức")}</Link>
        <div className="organization-detail-photo"><img src={photo.src} alt={photo.alt}/></div>
        <div className="organization-heading">
            <span className="organization-mark overflow-hidden p-1.5 bg-white border border-border shadow-xs">
                <img src={logo.src} alt="" className="h-full w-full object-cover rounded-xl" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="mb-2 text-sm text-primary">{renderText(catalogLabel(summary.organizationTypeName))}</p>
                <h1 className="min-w-0 max-w-full break-words text-3xl font-bold">{renderText(displayName(summary.name))}</h1>
                {renderText(isDemoName(summary.name) && <p className="mt-2 text-xs text-text-secondary">{tr("Dữ liệu mẫu")}</p>)}
            </div>
            <Badge tone={organizationStatuses[summary.status].tone}>{renderText(organizationStatuses[summary.status].label)}</Badge>
            <Button variant="secondary" onClick={() => setReload(true)}>{tr("Tải lại tổ chức")}</Button>
        </div>

        {/* Dynamic Activity Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-border bg-white p-4 shadow-2xs">
                <p className="text-2xl font-bold text-primary">350+</p>
                <p className="text-xs text-text-secondary mt-1">{tr("Tình nguyện viên năng động")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4 shadow-2xs">
                <p className="text-2xl font-bold text-primary">15+</p>
                <p className="text-xs text-text-secondary mt-1">{tr("Chiến dịch đã hoàn thành")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4 shadow-2xs">
                <p className="text-2xl font-bold text-primary">2.100+</p>
                <p className="text-xs text-text-secondary mt-1">{tr("Giờ công hiến cộng đồng")}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4 shadow-2xs">
                <p className="text-2xl font-bold text-emerald-600">99.2%</p>
                <p className="text-xs text-text-secondary mt-1">{tr("Đánh giá tích cực")}</p>
            </div>
        </div>

        <Card>
            <h2 className="mb-4 text-xl font-semibold">{tr("Giới thiệu tổ chức")}</h2>
            <div className="space-y-4">
                <p className="whitespace-pre-wrap break-words leading-relaxed">{renderText(desc || tr("Tổ chức sinh viên trực thuộc Trường Đại học Bách khoa – Đại học Đà Nẵng, tiên phong trong các hoạt động phụng sự cộng đồng và phát triển kỹ năng thanh niên."))}</p>
                <div className="border-t border-border pt-3">
                    <p className="text-sm text-text-secondary">{tr("Ngày tạo: ")}{renderText(new Date(summary.createdAt).toLocaleDateString(locale()))}{renderText(detail.verifiedAt && ` · Xác minh ${new Date(detail.verifiedAt).toLocaleDateString(locale())}`)}</p>
                </div>
                {renderText(detail.ownRole && <p>{tr("Vai trò của bạn:")} {renderText(memberRoles[detail.ownRole])}</p>)}
                {renderText(detail.ownRole && <p role="status" className={detail.canRepresent ? 'text-success' : 'text-text-secondary'}>
                    {renderText(detail.canRepresent ? tr("Bạn được quyền đại diện tổ chức đã xác minh này.") : tr("Bạn chưa được quyền đại diện. Tổ chức cần được xác minh và bạn cần là chủ sở hữu hoặc người quản lý."))}
                </p>)}
            </div>
        </Card>

        {/* Activity Photo Highlights */}
        <Card>
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">{tr("Khoảnh khắc sinh hoạt & hoạt động")}</h2>
                <span className="text-xs text-text-secondary">{tr("Hình ảnh hoạt động thực tế sinh viên DUT")}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="aspect-4/3 overflow-hidden rounded-xl border border-border bg-surface-muted group">
                    <img src="/images/dut-volunteer-summer.jpg" alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="aspect-4/3 overflow-hidden rounded-xl border border-border bg-surface-muted group">
                    <img src="/images/dut-volunteer-spring.jpg" alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="aspect-4/3 overflow-hidden rounded-xl border border-border bg-surface-muted group">
                    <img src="/images/dut-volunteer-beach.jpg" alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="aspect-4/3 overflow-hidden rounded-xl border border-border bg-surface-muted group">
                    <img src="/images/dut-volunteer-blood.jpg" alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
            </div>
        </Card>

        {renderText(summary.status === 'VERIFIED' && <OrganizationCampaigns id={summary.id}/>)}
        {renderText(detail.canEdit && <Card><h2 className="mb-5 text-xl font-semibold">{tr("Chỉnh sửa tổ chức")}</h2><OrganizationForm key={summary.id} detail={detail}/></Card>)}
        {renderText((detail.ownRole || user?.role === 'ADMIN') && <Card><OrganizationMembers key={summary.id} detail={detail}/></Card>)}
        {renderText(user?.role === 'ADMIN' && <Card><OrganizationModeration key={summary.id} detail={detail}/></Card>)}
        <ConfirmDialog open={reload} title={tr("Tải lại tổ chức?")} message={tr("Các thay đổi chưa lưu sẽ bị mất.")}
                       confirmLabel={tr("Tải lại")} onClose={() => setReload(false)} onConfirm={() => window.location.reload()}/>
    </div>;
}
