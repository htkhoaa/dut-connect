import {useLanguage, tr, renderText} from "../../../shared/lib/i18n";
import {useCampaigns} from '../../campaigns/hooks';
import {CampaignCard} from '../../campaigns/components/CampaignCard';
import {LoadingState} from '../../../shared/components/LoadingState';
import {ErrorState} from '../../../shared/components/ErrorState';
import {EmptyState} from '../../../shared/components/EmptyState';
import {errorMessage} from '../../../shared/api/errors';
export function OrganizationCampaigns({id}: {id: string}) {
    useLanguage();
    const query = useCampaigns('public', {page: 0, q: '', status: '', categoryId: '', organizationId: id, contributionMode: '', sort: 'newest'});
    const items = query.data?.items.slice(0, 3) || [];
    return <section className="space-y-5"><h2 className="text-2xl font-semibold">{tr("Chiến dịch của tổ chức")}</h2>{renderText(query.isPending ? <LoadingState/> : query.isError ? <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()}/> : items.length === 0 ? <EmptyState message={tr("Tổ chức chưa có chiến dịch được công bố.")}/> : <div className="campaign-grid">{renderText(items.map(c => <CampaignCard key={c.id} campaign={c}/>))}</div>)}</section>;
}
