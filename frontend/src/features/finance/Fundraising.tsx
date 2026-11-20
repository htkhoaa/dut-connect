import {useLanguage, tr} from "../../shared/lib/i18n";
import {vnd} from '../campaigns/presentation';
import {fundraisingPercent, formatPercent} from '../../shared/lib/fundraising';
export function Fundraising({raised,goal}:{raised:string;goal:string|null}){
    useLanguage();
    const percent = fundraisingPercent(raised, goal);
    const width = Math.max(0, Math.min(100, percent ?? 0));
    return <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <strong className="text-primary">{vnd(raised)}</strong>
            {goal && <span className="text-xs text-text-secondary">/ {vnd(goal)}</span>}
        </div>
        {percent !== null && <div role="progressbar" aria-label={tr('Tiến độ gây quỹ')} aria-valuemin={0}
            aria-valuemax={100} aria-valuenow={width} aria-valuetext={formatPercent(percent)}
            className="h-1.5 overflow-hidden rounded-full bg-primary-light">
            <div className="h-full rounded-full bg-primary" style={{width: `${width}%`}}/>
        </div>}
        <p className="text-xs text-text-secondary">{tr('Đóng góp đã xác nhận')}
            {percent !== null && ' · ' + formatPercent(percent) + ' ' + tr('mục tiêu')}
        </p>
    </div>;
}
