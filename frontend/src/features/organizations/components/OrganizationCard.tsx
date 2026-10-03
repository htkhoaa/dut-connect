import {Link} from 'react-router-dom';
import type {OrganizationSummary} from '../types';
import {organizationStatuses} from '../presentation';
import {Card} from '../../../shared/components/Card';
import {Badge} from '../../../shared/components/Badge';
import {Icon} from '../../../shared/components/Icon';
import {catalogLabel} from '../../../shared/lib/catalogLabels';
import {displayName, isDemoName} from '../../../shared/lib/demoPresentation';
import {organizationIcon, organizationPhoto} from '../visuals';
export function OrganizationCard({organization: o}: {organization: OrganizationSummary}) {
    const description = isDemoName(o.name) && o.description?.startsWith('Dữ liệu minh họa')
        ? o.description.split('\n\n').slice(1).join('\n\n') : o.description;
    const photo = organizationPhoto(o.name, o.organizationTypeName);
    return <Card className="organization-card organization-photo-card flex flex-col"><Link to={'/organizations/' + o.id} className="organization-cover" tabIndex={-1} aria-hidden="true"><img src={photo.src} alt="" loading="lazy"/><span className="image-caption">Ảnh tư liệu DUT</span></Link><div className="organization-card-body flex flex-1 flex-col"><div className="flex items-start justify-between gap-3"><span className="organization-mark"><Icon name={organizationIcon(o.name, o.organizationTypeName)} size={29}/></span><Badge tone={organizationStatuses[o.status].tone}>{organizationStatuses[o.status].label}</Badge></div>
        <p className="mb-2 mt-6 text-xs font-semibold text-primary">{catalogLabel(o.organizationTypeName)}</p><h2 className="text-lg font-semibold leading-relaxed"><Link to={'/organizations/' + o.id}>{displayName(o.name)}</Link></h2>
        {isDemoName(o.name) && <p className="mt-1 text-[10px] text-text-secondary">Dữ liệu mẫu</p>}
        <p className="card-summary mb-5 mt-3 text-sm text-text-secondary">{description || 'Kết nối cùng tổ chức và khám phá các hoạt động đóng góp cho cộng đồng.'}</p>
        <Link to={'/organizations/' + o.id} className="card-link mt-auto">Khám phá tổ chức <Icon name="arrow" size={17}/></Link>
    </div></Card>;
}
