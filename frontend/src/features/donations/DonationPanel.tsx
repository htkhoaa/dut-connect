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

const QUICK_AMOUNTS = ['50000', '100000', '200000', '500000', '1000000'];

export function DonationPanel({campaign}: { campaign: CampaignDetail }) {
    useLanguage();
    const {user, initialized} = useAuth();
    const settings = useDonationSettings();
    const navigate = useNavigate();
    const f = useForm<{amount: string}>({defaultValues: {amount: '100000'}});
    const [confirm, setConfirm] = useState<string | null>(null);
    const mutation = useDonationMutation((amount: string) => api.create(campaign.id, amount));

    if (campaign.content.contributionMode === 'VOLUNTEER_ONLY') return null;

    const closed = !['OPEN', 'ACTIVE'].includes(campaign.status)
        ? tr("Chiến dịch hiện không nhận đóng góp tài chính.")
        : campaign.content.fundraisingDeadline && Date.now() >= new Date(campaign.content.fundraisingDeadline).getTime()
            ? tr("Đã hết hạn gây quỹ.")
            : null;

    return (
        <Card className="border border-primary-muted/40 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">❤️</span>
                <h2 className="text-lg font-bold text-text-primary">{tr("Tiếp sức cho chiến dịch")}</h2>
            </div>

            {closed ? (
                <p className="text-sm text-text-secondary">{renderText(closed)}</p>
            ) : !initialized ? (
                <LoadingState />
            ) : !user ? (
                <div className="space-y-3">
                    <p className="text-xs text-text-secondary leading-relaxed">
                        {tr("Đăng nhập để ủng hộ và lưu lại lịch sử đóng góp của bạn trên hệ thống.")}
                    </p>
                    <Link
                        className="ui-button ui-button-primary w-full text-center"
                        to="/login"
                        state={{from: '/campaigns/' + campaign.slug}}
                    >
                        {tr("Đăng nhập để ủng hộ")}
                    </Link>
                </div>
            ) : settings.isPending ? (
                <LoadingState />
            ) : settings.isError ? (
                <ErrorState message={errorMessage(settings.error)} onRetry={() => void settings.refetch()} />
            ) : !settings.data.available ? (
                <p role="status" className="text-sm text-text-secondary">
                    {tr("Cổng thanh toán hiện chưa khả dụng. Bạn vẫn có thể tham gia các hoạt động khác.")}
                </p>
            ) : (
                <div className="space-y-4">
                    <form
                        noValidate
                        className="space-y-4"
                        onSubmit={f.handleSubmit(({amount}) => {
                            const parsed = z.string().trim().regex(/^[0-9]{1,19}$/, tr("Nhập số tiền VND nguyên")).safeParse(amount);
                            if (!parsed.success) {
                                f.setError('amount', {message: parsed.error.issues[0].message});
                                return;
                            }
                            const n = BigInt(parsed.data);
                            if (n < BigInt(settings.data.minimumVnd) || n > BigInt(settings.data.maximumVnd)) {
                                f.setError('amount', {message: tr("Số tiền nằm ngoài giới hạn đóng góp")});
                                return;
                            }
                            setConfirm(n.toString());
                        })}
                    >
                        {/* Quick select buttons */}
                        <div>
                            <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                                {tr("Chọn nhanh số tiền:")}
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {QUICK_AMOUNTS.map(amt => (
                                    <button
                                        key={amt}
                                        type="button"
                                        onClick={() => f.setValue('amount', amt, {shouldValidate: true})}
                                        className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all ${
                                            f.watch('amount') === amt
                                                ? 'bg-primary text-white border-primary shadow-xs'
                                                : 'border-border bg-white text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                                        }`}
                                    >
                                        {vnd(amt)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <FormField
                            id="donation-amount"
                            label={tr("Hoặc tự nhập số tiền đóng góp (VND)")}
                            error={f.formState.errors.amount?.message}
                        >
                            <Input
                                id="donation-amount"
                                inputMode="numeric"
                                maxLength={19}
                                placeholder="Ví dụ: 100000"
                                disabled={mutation.isPending}
                                {...f.register('amount')}
                            />
                        </FormField>

                        {mutation.isError && (
                            <ErrorState message={errorMessage(mutation.error)} />
                        )}

                        <Button
                            type="submit"
                            className="w-full font-bold shadow-xs"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? tr("Đang tạo mã VietQR…") : tr("Tạo mã VietQR ủng hộ")}
                        </Button>
                    </form>

                    <ConfirmDialog
                        open={confirm !== null}
                        title={tr("Xác nhận tạo mã quyên góp?")}
                        message={confirm ? `Bạn muốn quyên góp ${vnd(confirm)} cho chiến dịch này? Hệ thống sẽ tạo mã VietQR động để bạn quét chuyển khoản.` : ''}
                        confirmLabel={tr("Tạo mã QR")}
                        busy={mutation.isPending}
                        onClose={() => setConfirm(null)}
                        onConfirm={() => {
                            if (confirm) {
                                mutation.mutate(confirm, {
                                    onSuccess: r => {
                                        if (r.checkoutUrl && r.checkoutUrl.startsWith('http') && !r.checkoutUrl.includes('/payment/result')) {
                                            window.location.href = r.checkoutUrl;
                                        } else {
                                            const query = r.checkoutUrl?.includes('?') ? '&' + r.checkoutUrl.split('?')[1] : '';
                                            navigate('/payment/result?donationId=' + r.donationId + query);
                                        }
                                    },
                                    onError: e => {
                                        setConfirm(null);
                                        for (const field of apiError(e)?.fieldErrors || []) {
                                            if (field.field === 'amount') f.setError('amount', {message: field.message});
                                        }
                                    }
                                });
                            }
                        }}
                    />
                </div>
            )}
        </Card>
    );
}
