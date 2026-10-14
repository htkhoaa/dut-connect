import {useLanguage, tr, renderText, locale} from "../../../shared/lib/i18n";
import {Link} from 'react-router-dom';
import type {CampaignSummary} from '../types';
import type {FundraisingProgress} from '../../finance/types';
import {campaignStatuses, modes} from '../presentation';
import {campaignVisual} from '../visuals';
import {catalogLabel} from '../../../shared/lib/catalogLabels';
import {Card} from '../../../shared/components/Card';
import {Icon} from '../../../shared/components/Icon';
import {Badge} from '../../../shared/components/Badge';
import {Fundraising} from '../../finance/Fundraising';
import {displayName, isDemoName} from '../../../shared/lib/demoPresentation';
export function CampaignCard({campaign: c, progress, financialPending, financialError, onRetry, managed = false}: {
    campaign: CampaignSummary; progress?: FundraisingProgress; financialPending?: boolean; financialError?: boolean; onRetry?: () => void; managed?: boolean;
}) {
    useLanguage();
    const visual = campaignVisual(c.categoryName, c.title);
    const path = managed ? '/manage/campaigns/' + c.id : '/campaigns/' + c.slug;
    return <Card className="campaign-card flex flex-col">
        <Link to={path} className="campaign-cover block" tabIndex={-1} aria-hidden="true"><img src={visual.image} alt="" loading="lazy"/><span className="cover-badge"><Badge tone={campaignStatuses[c.status].tone}>{renderText(campaignStatuses[c.status].label)}</Badge></span></Link>
        <div className="campaign-card-body flex flex-1 flex-col">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-primary"><Icon name={visual.icon} size={14}/>{renderText(catalogLabel(c.categoryName))}</p>
            <h2><Link to={path} className="hover:text-primary">{renderText(displayName(c.title))}</Link></h2>
            {renderText(isDemoName(c.title) && <span className="mt-1 text-[10px] text-text-secondary">{tr("Dữ liệu mẫu")}</span>)}
            {c.summary.includes('mô phỏng') && <span className="mt-2 w-fit soft-tag">{tr('Lịch mô phỏng')}</span>}
            <p className="card-summary mt-2 text-sm text-text-secondary">{renderText(c.summary)}</p>
            <p className="mt-4 flex items-start gap-2 text-xs text-text-secondary"><Icon name="building" size={15}/><span>{renderText(displayName(c.organizerName))}</span></p>
            <div className="my-4 flex flex-wrap gap-2"><span className="soft-tag">{renderText(modes[c.contributionMode])}</span></div>
            <div className="mt-auto space-y-3 border-t border-border pt-4">
                <p className="flex items-center gap-2 text-xs text-text-secondary"><Icon name="calendar" size={15}/>{renderText(new Date(c.startDate + 'T00:00:00').toLocaleDateString(locale()))} – {renderText(new Date(c.endDate + 'T00:00:00').toLocaleDateString(locale()))}</p>
                {renderText(c.targetVolunteerCount != null && c.contributionMode !== 'DONATION_ONLY' && <p className="flex items-center gap-2 text-sm"><Icon name="users" size={16}/><strong>{renderText(c.targetVolunteerCount)}</strong><span className="text-text-secondary">{tr("vị trí tình nguyện")}</span></p>)}
                {renderText(c.contributionMode !== 'VOLUNTEER_ONLY' && (progress ? <Fundraising raised={progress.verifiedDonations} goal={c.fundraisingGoal}/> : financialError ? <p className="text-xs text-danger">{tr("Chưa tải được tiến độ.")}<button className="underline" onClick={onRetry}>{tr("Thử lại")}</button></p> : financialPending ? <p role="status" className="text-xs text-text-secondary">{tr("Đang tải tiến độ…")}</p> : null))}
                <Link to={path} className="card-link">{renderText(managed ? tr("Quản lý chiến dịch") : tr("Xem chiến dịch"))}<Icon name="arrow" size={17}/></Link>
            </div>
        </div>
    </Card>;
}
