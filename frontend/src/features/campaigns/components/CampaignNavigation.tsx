import {useLanguage, tr, renderText} from "../../../shared/lib/i18n";
import {NavLink} from 'react-router-dom';
import {Icon, type IconName} from '../../../shared/components/Icon';
const items: {path: string; label: string; icon: IconName}[] = [
    {path: 'applications', label: 'Đăng ký tình nguyện', icon: 'users'}, {path: 'team', label: 'Đội tình nguyện', icon: 'users'},
    {path: 'meetings', label: 'Lịch họp', icon: 'calendar'}, {path: 'tasks', label: 'Nhiệm vụ', icon: 'check'},
    {path: 'attendance', label: 'Điểm danh', icon: 'calendar'}, {path: 'completions', label: 'Xác minh hoàn thành', icon: 'shield'},
    {path: 'finance', label: 'Tài chính', icon: 'heart'}, {path: 'ai', label: 'Gợi ý AI', icon: 'spark'}, {path: 'reports', label: 'Báo cáo', icon: 'file'},
];
export function CampaignNavigation({id}: {id: string}) {
    useLanguage();
    return <nav aria-label={tr("Quản lý chiến dịch")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{renderText(items.map(item => <NavLink key={item.path} to={'/manage/campaigns/' + id + '/' + item.path} className={({isActive}) => 'flex items-center gap-3 rounded-xl border border-border bg-surface p-4 text-sm font-medium transition-colors hover:border-primary-muted hover:bg-primary-light ' + (isActive ? 'text-primary' : 'text-text-primary')}><span className="metric-icon"><Icon name={item.icon} size={18}/></span>{renderText(item.label)}<Icon name="arrow" size={15} className="ml-auto text-text-secondary"/></NavLink>))}</nav>;
}
