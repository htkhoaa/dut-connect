import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useAuth} from '../auth/store';
import type {CampaignDetail} from '../campaigns/types';
import {vnd} from '../campaigns/presentation';
import {useDonationSettings, useDonationMutation} from './hooks';
import * as api from './api';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {Input} from '../../shared/components/Input';
import {FormField} from '../../shared/components/FormField';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage, apiError} from '../../shared/api/errors';

export function DonationPanel({campaign}: { campaign: CampaignDetail }) {
    useLanguage();
    const {user, initialized} = useAuth(), settings = useDonationSettings(), navigate = useNavigate();
    const f = useForm<{
        amount: string
    }>({defaultValues: {amount: ''}}), [confirm, setConfirm] = useState<string | null>(null);
    const mutation = useDonationMutation((amount: string) => api.create(campaign.id, amount));
    if (campaign.content.contributionMode === 'VOLUNTEER_ONLY') return null;
    const closed = !['OPEN', 'ACTIVE'].includes(campaign.status) ? tr("Chiến dịch hiện không nhận đóng góp tài chính.") : campaign.content.fundraisingDeadline && Date.now() >= new Date(campaign.content.fundraisingDeadline).getTime() ? tr("Đã hết hạn gây quỹ.") : null;
    return <Card><h2 className="mb-4 text-xl font-semibold">{tr("Tiếp sức cho chiến dịch")}</h2>{renderText(closed ?
        <p>{renderText(closed)}</p> : !initialized ? <LoadingState/> : !user ?
            <Link className="text-primary hover:underline" to="/login" state={{from: '/campaigns/' + campaign.slug}}>{tr("Đăng nhập để ủng hộ")}</Link> : settings.isPending ? <LoadingState/> : settings.isError ?
                <ErrorState message={errorMessage(settings.error)}
                            onRetry={() => void settings.refetch()}/> : !settings.data.available ?
                    <p role="status">{tr("Thanh toán hiện chưa khả dụng. Bạn vẫn có thể tham gia các hoạt động khác.")}</p> : <><p
                        className="mb-4">{renderText(settings.data.provider === 'mock' ? tr("Thanh toán mô phỏng. Không thu tiền thật.") : tr("Thanh toán qua ZaloPay Sandbox. Không dùng cổng thanh toán tiền thật."))}{tr("Số tiền:")}{renderText(vnd(settings.data.minimumVnd))} to {renderText(vnd(settings.data.maximumVnd))}.</p>
                        <form noValidate className="space-y-4" onSubmit={f.handleSubmit(({amount}) => {
                            const parsed = z.string().trim().regex(/^[0-9]{1,19}$/, tr("Nhập số tiền VND nguyên")).safeParse(amount);
                            if (!parsed.success) {
                                f.setError('amount', {message: parsed.error.issues[0].message});
                                return;
                            }
                            const n = BigInt(parsed.data);
                            if (n < BigInt(settings.data.minimumVnd) || n > BigInt(settings.data.maximumVnd)) {
                                f.setError('amount', {message: tr("Số tiền nằm ngoài giới hạn đóng góp được hiển thị")});
                                return;
                            }
                            setConfirm(n.toString());
                        })}><FormField id="donation-amount" label={tr("Số tiền đóng góp (VND)")}
                                       error={f.formState.errors.amount?.message}><Input id="donation-amount"
                                                                                         inputMode="numeric"
                                                                                         maxLength={19}
                                                                                         disabled={mutation.isPending} {...f.register('amount')}/></FormField>{renderText(mutation.isError &&
                            <ErrorState message={errorMessage(mutation.error)}/>)}<Button type="submit"
                                                                                         disabled={mutation.isPending}>{tr("Tiếp tục thanh toán")}</Button></form>
                        <ConfirmDialog open={confirm !== null} title={tr("Xác nhận khoản đóng góp?")}
                                       message={confirm ? `Đóng góp ${vnd(confirm)} cho chiến dịch? Khoản đóng góp chỉ được xác nhận sau khi hệ thống kiểm tra kết quả thanh toán.` : ''}
                                       confirmLabel={tr("Tạo khoản đóng góp")} busy={mutation.isPending}
                                       onClose={() => setConfirm(null)} onConfirm={() => {
                            if (confirm) mutation.mutate(confirm, {
                                onSuccess: r => navigate('/payment/result?donationId=' + r.donationId),
                                onError: e => {
                                    setConfirm(null);
                                    for (const field of apiError(e)?.fieldErrors || []) if (field.field === 'amount') f.setError('amount', {message: field.message});
                                }
                            });
                        }}/></>)}</Card>;
}
