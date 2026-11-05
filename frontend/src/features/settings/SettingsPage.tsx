import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useState, useEffect} from 'react';
import {useSearchParams, Link} from 'react-router-dom';
import {Icon, type IconName} from '../../shared/components/Icon';
import {ProfilePage} from '../profile/ProfilePage';
import {HistoryPage} from '../volunteers/HistoryPage';
import {DonationsPage} from '../donations/DonationsPage';
import {OrganizationListPage} from '../organizations/OrganizationListPage';
import {ProposalListPage} from '../proposals/ProposalListPage';

type TabId = 'profile' | 'history' | 'donations' | 'organizations' | 'proposals';
type Tab = {id: TabId; label: string; icon: IconName};

const tabs: Tab[] = [
    {id: 'profile', label: 'Hồ sơ & kỹ năng', icon: 'users'},
    {id: 'history', label: 'Lịch sử tình nguyện', icon: 'calendar'},
    {id: 'donations', label: 'Khoản ủng hộ', icon: 'heart'},
    {id: 'organizations', label: 'Tổ chức của tôi', icon: 'building'},
    {id: 'proposals', label: 'Đề xuất chiến dịch', icon: 'file'},
];

export function SettingsPage() {
    useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab') as TabId | null;
    const [active, setActive] = useState<TabId>(tabParam && tabs.some(t => t.id === tabParam) ? tabParam : 'profile');

    useEffect(() => {
        if (tabParam && tabs.some(t => t.id === tabParam)) {
            setActive(tabParam);
        }
    }, [tabParam]);

    const selectTab = (id: TabId) => {
        setActive(id);
        setSearchParams({tab: id});
    };

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                    <p className="eyebrow mb-1 text-primary">{tr("KHÔNG GIAN CỦA BẠN")}</p>
                    <h1 className="text-3xl font-bold">{tr("Cài đặt cá nhân")}</h1>
                </div>
                <Link to="/campaigns" className="ui-button ui-button-secondary">
                    {tr("← Khám phá chiến dịch")}
                </Link>
            </div>

            {/* Horizontal Tabs */}
            <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-surface p-1.5 shadow-sm">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                            active === tab.id
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                        }`}
                        onClick={() => selectTab(tab.id)}
                    >
                        <Icon name={tab.icon} size={17} />
                        {renderText(tr(tab.label))}
                    </button>
                ))}
            </div>

            {/* Content area */}
            <div className="pt-2">
                {active === 'profile' && <ProfilePage />}
                {active === 'history' && <HistoryPage />}
                {active === 'donations' && <DonationsPage />}
                {active === 'organizations' && <OrganizationListPage scope="mine" />}
                {active === 'proposals' && <ProposalListPage />}
            </div>
        </div>
    );
}
