import {useSearchParams, Link, useParams} from 'react-router-dom';
import {useDonation} from './hooks';
import {validId} from './types';
import {DonationCard} from './DonationCard';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';

export function PaymentResultPage() {
    const [params] = useSearchParams();
    const route = useParams();
    const id = route.donationId || params.get('donationId') || '';
    const q = useDonation(id);
    return <div className="space-y-6"><h1 className="text-3xl font-semibold">Kết quả thanh toán</h1><p>Trạng thái được xác nhận từ hệ thống thanh toán. Chuyển hướng hoặc tham số URL không xác nhận thanh toán.</p><Link
        className="text-primary hover:underline" to="/me/donations">Khoản đóng góp của tôi</Link>{!validId(id) ?
        <ErrorState message="Cần mã khoản đóng góp hợp lệ."/> : q.isPending ? <LoadingState/> : q.isError ?
            <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()}/> :
            <DonationCard donation={q.data}/>}</div>;
}
