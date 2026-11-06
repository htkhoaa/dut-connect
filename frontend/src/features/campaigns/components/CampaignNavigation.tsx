import {useLanguage, tr, renderText} from "../../../shared/lib/i18n";
import {NavLink} from 'react-router-dom';
import {Icon, type IconName} from '../../../shared/components/Icon';
import type {ContributionMode} from '../types';

interface NavItem {
    path: string;
    label: string;
    icon: IconName;
    modes?: ContributionMode[];
}

const allItems: NavItem[] = [
    {path: 'applications', label: 'Đăng ký tình nguyện', icon: 'users', modes: ['VOLUNTEER_ONLY', 'HYBRID']},
    {path: 'finance', label: 'Tài chính', icon: 'heart', modes: ['DONATION_ONLY', 'HYBRID']},
    {path: 'completions', label: 'Xác minh hoàn thành', icon: 'shield', modes: ['VOLUNTEER_ONLY', 'HYBRID']},
    {path: 'reports', label: 'Báo cáo', icon: 'file', modes: ['VOLUNTEER_ONLY', 'DONATION_ONLY', 'HYBRID']},
];

export function CampaignNavigation({id, mode}: {id: string; mode?: ContributionMode}) {
    useLanguage();
    const items = mode ? allItems.filter(item => !item.modes || item.modes.includes(mode)) : allItems;

    return (
        <nav aria-label={tr("Quản lý chiến dịch")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {renderText(
                items.map(item => (
                    <NavLink
                        key={item.path}
                        to={'/manage/campaigns/' + id + '/' + item.path}
                        className={({isActive}) =>
                            'flex items-center gap-3 rounded-xl border border-border bg-surface p-4 text-sm font-medium transition-colors hover:border-primary-muted hover:bg-primary-light ' +
                            (isActive ? 'text-primary border-primary' : 'text-text-primary')
                        }
                    >
                        <span className="metric-icon">
                            <Icon name={item.icon} size={18} />
                        </span>
                        {renderText(item.label)}
                        <Icon name="arrow" size={15} className="ml-auto text-text-secondary" />
                    </NavLink>
                ))
            )}
        </nav>
    );
}
