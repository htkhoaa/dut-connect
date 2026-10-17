import {useLanguage, tr, renderText, locale} from "../../../shared/lib/i18n";
import type {Content} from '../types';
import {modes, organizers, dateTime} from '../presentation';
import {catalogLabel} from '../../../shared/lib/catalogLabels';
import {Icon} from '../../../shared/components/Icon';
import {displayName} from '../../../shared/lib/demoPresentation';
export function PlanContent({content: c, organizerName, categoryName}: {content: Content; organizerName: string; categoryName: string}) {
    useLanguage();
    return <div className="space-y-6 break-words">
        <div className="grid gap-4 rounded-xl bg-surface-muted p-4 sm:grid-cols-2"><div><p className="text-xs text-text-secondary">{tr("Đơn vị tổ chức")}</p><p className="mt-1 text-sm font-semibold">{renderText(displayName(organizerName))}</p><p className="mt-1 text-xs text-text-secondary">{renderText(organizers[c.organizerType])} · {renderText(catalogLabel(categoryName))}</p></div><div><p className="flex items-center gap-1.5 text-xs text-text-secondary"><Icon name="calendar" size={14}/>{tr("Thời gian diễn ra")}</p><p className="mt-1 text-sm font-semibold">{renderText(new Date(c.startDate + 'T00:00:00').toLocaleDateString(locale()))} – {renderText(new Date(c.endDate + 'T00:00:00').toLocaleDateString(locale()))}</p><p className="mt-1 text-xs text-text-secondary">{renderText(modes[c.contributionMode])}</p></div></div>
        <p className="font-medium leading-relaxed">{renderText(c.summary)}</p><p className="whitespace-pre-wrap text-sm leading-7 text-text-secondary">{renderText(c.description)}</p>
        {renderText(c.expectedImpact && <div><h3 className="mb-2 font-semibold">{tr("Giá trị hướng đến")}</h3><p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{renderText(c.expectedImpact)}</p></div>)}
        {renderText(c.contributionMode !== 'DONATION_ONLY' && <div className="space-y-3 border-t border-border pt-5"><h3 className="font-semibold">{tr("Kế hoạch tình nguyện")}</h3><div className="grid grid-cols-3 gap-2">{renderText([[tr("Tổng vị trí"), c.targetVolunteerCount], [tr("Kỹ thuật"), c.targetTechnicalCount], ['Hậu cần', c.targetLogisticsCount]].map(([label, value]) => <div key={label} className="rounded-xl bg-primary-light p-3"><p className="text-xl font-semibold text-primary">{renderText(value ?? '—')}</p><p className="mt-1 text-xs text-text-secondary">{renderText(label)}</p></div>))}</div><p className="text-sm text-text-secondary">{tr("Hạn đăng ký:")}<span className="text-text-primary">{renderText(dateTime(c.applicationDeadline))}</span></p>{renderText(c.volunteerRequirements && <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{renderText(c.volunteerRequirements)}</p>)}</div>)}
    </div>;
}
