import {useState} from 'react';
import {useDonationQuery} from './hooks';
import * as api from './api';
import {DonationCard} from './DonationCard';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {EmptyState} from '../../shared/components/EmptyState';
import {Pagination} from '../../shared/components/Pagination';
import {errorMessage} from '../../shared/api/errors';

export function DonationsPage() {
    const [page, setPage] = useState(0), q = useDonationQuery(['mine', page], () => api.mine(page));
    return <div className="space-y-6"><h1 className="text-3xl font-semibold">Khoản đóng góp của tôi</h1>{q.isPending ?
        <LoadingState/> : q.isError ? <ErrorState message={errorMessage(q.error)}
                                                  onRetry={() => void q.refetch()}/> : <>{q.data.items.length ? q.data.items.map(d =>
            <DonationCard key={d.id} donation={d}/>) : <EmptyState message="Bạn chưa có khoản đóng góp nào."/>}<Pagination {...q.data}
                                                                                                             onPageChange={setPage}/></>}
    </div>;
}
