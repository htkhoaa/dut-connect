import {useLanguage, tr, renderText} from "../../../shared/lib/i18n";
import {Link} from 'react-router-dom';
import type {OrganizationSummary} from '../types';
import {organizationStatuses} from '../presentation';
import {Card} from '../../../shared/components/Card';
import {Badge} from '../../../shared/components/Badge';
import {Icon} from '../../../shared/components/Icon';
import {catalogLabel} from '../../../shared/lib/catalogLabels';
import {displayName, isDemoName} from '../../../shared/lib/demoPresentation';
import {organizationPhoto, organizationLogo} from '../visuals';

function cleanOrgDescription(raw?: string | null): string {
    if (!raw) return "";
    let text = raw;
    if (isDemoName(text) && text.startsWith(tr("Dữ liệu minh họa"))) {
        text = text.split('\n\n').slice(1).join('\n\n');
    }
    // Remove "Nguồn hoạt động:" and "Hồ sơ phục vụ"
    return text.split('\n\n').filter(paragraph => 
        !paragraph.includes("Nguồn hoạt động:") && 
        !paragraph.includes("Hồ sơ phục vụ") &&
        !paragraph.includes("https://dut.udn.vn")
    ).join('\n\n');
}

export function OrganizationCard({organization: o}: {organization: OrganizationSummary}) {
    useLanguage();
    const description = cleanOrgDescription(o.description);
    const photo = organizationPhoto(o.name, o.organizationTypeName);
    const logo = organizationLogo(o.name, o.organizationTypeName);

    return <Card className="organization-card organization-photo-card flex flex-col"><Link to={'/organizations/' + o.id} className="organization-cover" tabIndex={-1} aria-hidden="true"><img src={photo.src} alt="" loading="lazy"/></Link><div className="organization-card-body flex flex-1 flex-col"><div className="flex items-start justify-between gap-3"><span className="organization-mark overflow-hidden p-1 bg-white border border-border shadow-xs"><img src={logo.src} alt="" className="h-full w-full object-cover rounded-xl" /></span><Badge tone={organizationStatuses[o.status].tone}>{renderText(organizationStatuses[o.status].label)}</Badge></div>
        <p className="mb-2 mt-6 text-xs font-semibold text-primary">{renderText(catalogLabel(o.organizationTypeName))}</p><h2 className="text-lg font-semibold leading-relaxed"><Link to={'/organizations/' + o.id}>{renderText(displayName(o.name))}</Link></h2>
        {renderText(isDemoName(o.name) && <p className="mt-1 text-[10px] text-text-secondary">{tr("Dữ liệu mẫu")}</p>)}
        <p className="card-summary mb-5 mt-3 text-sm text-text-secondary leading-relaxed">{renderText(description || tr("Kết nối cùng tổ chức và khám phá các hoạt động đóng góp cho cộng đồng sinh viên DUT."))}</p>
        <Link to={'/organizations/' + o.id} className="card-link mt-auto">{tr("Khám phá tổ chức")}<Icon name="arrow" size={17}/></Link>
    </div></Card>;
}
