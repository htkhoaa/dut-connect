import {Link} from 'react-router-dom';
import type {Donation} from './types';
import {donationStatuses, checkoutLink} from './types';
import {vnd} from '../campaigns/presentation';
import {useDonationMutation} from './hooks';
import * as api from './api';
import {Card} from '../../shared/components/Card';
import {Badge} from '../../shared/components/Badge';
import {Button} from '../../shared/components/Button';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';

export function DonationCard({donation: d}: { donation: Donation }) {
    const refresh = useDonationMutation((id: string) => api.refresh(id));
    const p = d.payments[0];
    const pending = d.status === 'CREATED' || d.status === 'PENDING_PAYMENT';
    const link = pending ? checkoutLink(p?.checkoutUrl || null) : null;
    return <Card>
        <div className="flex flex-wrap justify-between gap-3"><h2 className="break-words text-xl font-semibold"><Link
            className="text-primary hover:underline" to={'/campaigns/' + d.campaignSlug}>{d.campaignTitle}</Link></h2><Badge
            tone={donationStatuses[d.status].tone}>{donationStatuses[d.status].label}</Badge></div>
        <p className="mt-3 text-lg font-semibold">{vnd(d.amount)}</p>
        <p>Ngày tạo {new Date(d.createdAt).toLocaleString('vi-VN')}</p>{p?.paidAt &&
        <p>Đã thanh toán {new Date(p.paidAt).toLocaleString('vi-VN')}</p>}{p?.failureReason &&
        <p role="status" className="break-words">{p.failureReason}</p>}{pending &&
        <p className="mt-3">Kết quả thanh toán được xác nhận từ hệ thống. Làm mới để xem trạng thái mới nhất.</p>}
        <div className="mt-4 flex flex-wrap gap-4"><Link className="text-primary hover:underline"
                                                         to={'/payment/result?donationId=' + d.id}>Kết quả thanh toán</Link>{link && (link.startsWith('/') ?
            <Link className="text-primary hover:underline" to={link}>Mở trang thanh toán</Link> :
            <a className="text-primary hover:underline" href={link} rel="noreferrer">Mở thanh toán ZaloPay Sandbox</a>)}{pending && p && <Button disabled={refresh.isPending}
                                                       onClick={() => refresh.mutate(p.id)}>{refresh.isPending ? 'Đang làm mới…' : 'Làm mới trạng thái'}</Button>}
        </div>
        {refresh.isError && <ErrorState message={errorMessage(refresh.error)}/>}</Card>;
}
