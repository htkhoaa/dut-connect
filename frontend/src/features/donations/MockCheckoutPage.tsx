import {useState} from 'react';
import {useParams, Link, useNavigate} from 'react-router-dom';
import {useDonationQuery, useDonationMutation} from './hooks';
import {validId, paymentStatuses} from './types';
import * as api from './api';
import {vnd} from '../campaigns/presentation';
import {Card} from '../../shared/components/Card';
import {Badge} from '../../shared/components/Badge';
import {Button} from '../../shared/components/Button';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {ErrorState} from '../../shared/components/ErrorState';
import {LoadingState} from '../../shared/components/LoadingState';
import {errorMessage} from '../../shared/api/errors';

export function MockCheckoutPage() {
    const {paymentId = ''} = useParams(), navigate = useNavigate();
    const q = useDonationQuery(['mock', paymentId], () => api.mockCheckout(paymentId), validId(paymentId));
    const [action, setAction] = useState<'success' | 'fail' | null>(null);
    const m = useDonationMutation((outcome: 'success' | 'fail') => api.simulate(paymentId, outcome));
    const p = q.data;
    const pending = p && (p.status === 'CREATED' || p.status === 'PROVIDER_PENDING');
    return <div className="space-y-6"><h1 className="text-3xl font-semibold">Thanh toán mô phỏng</h1><p>Thanh toán mô phỏng dành cho bản demo. Không thu tiền thật. Sự kiện thanh toán được hệ thống xác minh.</p>{!validId(paymentId) ? <ErrorState message="Mã thanh toán không hợp lệ."/> : q.isPending ?
        <LoadingState/> : q.isError ?
            <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()}/> : p &&
            <Card><p className="text-xl font-semibold">{vnd(p.amount)}</p><Badge tone={paymentStatuses[p.status].tone}>{paymentStatuses[p.status].label}</Badge>
                <div className="mt-4 flex flex-wrap gap-4">{pending && <><Button disabled={m.isPending}
                                                                                 onClick={() => setAction('success')}>Mô phỏng thành công</Button><Button disabled={m.isPending} onClick={() => setAction('fail')}>Mô phỏng thất bại</Button></>}<Link className="text-primary hover:underline"
                                                     to={'/payment/result?donationId=' + p.donationId}>Về kết quả thanh toán</Link></div>
            </Card>}{m.isError && <ErrorState message={errorMessage(m.error)}/>}<ConfirmDialog open={action !== null}
                                                                                               title="Mô phỏng kết quả thanh toán?"
                                                                                               message={action === 'success' ? 'Sự kiện thành công có chữ ký sẽ được hệ thống xác minh trước khi cập nhật thanh toán.' : 'Sự kiện thất bại có chữ ký sẽ được gửi qua luồng xác minh thanh toán của hệ thống.'}
                                                                                               busy={m.isPending}
                                                                                               confirmLabel="Mô phỏng"
                                                                                               onClose={() => setAction(null)}
                                                                                               onConfirm={() => {
                                                                                                   if (action) m.mutate(action, {
                                                                                                       onSuccess: d => navigate('/payment/result?donationId=' + d.id),
                                                                                                       onError: () => setAction(null)
                                                                                                   });
                                                                                               }}/></div>;
}
