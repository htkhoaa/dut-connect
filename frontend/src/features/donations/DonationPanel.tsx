import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useQueryClient} from '@tanstack/react-query';
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

interface ActiveDonation {
    donationId: string;
    amount: string;
    vietQrUrl: string;
    orderCode: string;
    checkoutUrl?: string;
    paymentId?: string;
}

export function DonationPanel({campaign}: { campaign: CampaignDetail }) {
    useLanguage();
    const {user, initialized} = useAuth();
    const settings = useDonationSettings();
    const queryClient = useQueryClient();
    const f = useForm<{amount: string}>({defaultValues: {amount: '100000'}});
    const [confirm, setConfirm] = useState<string | null>(null);
    const [activeDonation, setActiveDonation] = useState<ActiveDonation | null>(null);
    const [checking, setChecking] = useState(false);
    const [checkMessage, setCheckMessage] = useState<string | null>(null);
    const [isPaid, setIsPaid] = useState(false);

    const mutation = useDonationMutation((amount: string) => api.create(campaign.id, amount));

    // Polling payment status when QR code is active
    useEffect(() => {
        if (!activeDonation || isPaid) return;
        const interval = setInterval(async () => {
            try {
                const res = await api.detail(activeDonation.donationId);
                if (res.status === 'PAID') {
                    setIsPaid(true);
                    setCheckMessage(tr("Đã nhận được tiền ủng hộ thành công!"));
                    void queryClient.invalidateQueries({queryKey: ['campaign', campaign.id]});
                    void queryClient.invalidateQueries({queryKey: ['financial-summary', campaign.id]});
                    void queryClient.invalidateQueries({queryKey: ['campaign-dashboard', campaign.id]});
                }
            } catch {
                // ignore polling errors
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [activeDonation, isPaid, campaign.id, queryClient]);

    const checkManual = async () => {
        if (!activeDonation) return;
        setChecking(true);
        setCheckMessage(null);
        try {
            let res = await api.detail(activeDonation.donationId);
            if (res.status !== 'PAID' && activeDonation.paymentId) {
                try {
                    res = await api.refresh(activeDonation.paymentId);
                } catch {
                    // ignore
                }
            }
            if (res.status === 'PAID') {
                setIsPaid(true);
                setCheckMessage(tr("Xác nhận thành công! Cảm ơn tấm lòng hảo tâm của bạn."));
                void queryClient.invalidateQueries({queryKey: ['campaign', campaign.id]});
                void queryClient.invalidateQueries({queryKey: ['financial-summary', campaign.id]});
                void queryClient.invalidateQueries({queryKey: ['campaign-dashboard', campaign.id]});
            } else {
                setCheckMessage(tr("Hệ thống chưa nhận được thông báo chuyển khoản. Vui lòng thử lại sau vài giây sau khi chuyển tiền."));
            }
        } catch (e) {
            setCheckMessage(errorMessage(e));
        } finally {
            setChecking(false);
        }
    };

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
            ) : isPaid ? (
                <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <span className="text-2xl">🎉</span>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-emerald-900">{tr("Ủng hộ thành công!")}</h3>
                        <p className="mt-1 text-xs text-emerald-700 leading-relaxed">
                            {tr("Khoản đóng góp của bạn đã được ghi nhận tự động vào chiến dịch. Cảm ơn sự đồng hành của bạn!")}
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        className="w-full text-xs font-semibold"
                        onClick={() => {
                            setActiveDonation(null);
                            setIsPaid(false);
                            setCheckMessage(null);
                        }}
                    >
                        {tr("Tiếp tục ủng hộ")}
                    </Button>
                </div>
            ) : activeDonation ? (
                <div className="space-y-4 rounded-2xl border-2 border-primary/30 bg-primary-light/20 p-4 text-center">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                            ⚡ {tr("Mã VietQR tiếp sức")}
                        </span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                            {tr("Chờ quét mã")}
                        </span>
                    </div>

                    <div className="flex justify-center py-1">
                        <div className="rounded-2xl border border-border bg-white p-2.5 shadow-md">
                            <img
                                src={activeDonation.vietQrUrl}
                                alt="Mã VietQR ủng hộ"
                                className="h-56 w-56 rounded-xl object-contain"
                            />
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-3 text-left text-xs space-y-1.5 border border-border/80">
                        <div className="flex justify-between">
                            <span className="text-text-secondary">{tr("Số tiền:")}</span>
                            <strong className="text-sm font-bold text-primary">{vnd(activeDonation.amount)}</strong>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">{tr("Ngân hàng:")}</span>
                            <span className="font-semibold text-text-primary">MB Bank</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">{tr("Số tài khoản:")}</span>
                            <span className="font-mono font-semibold text-text-primary">4310072005</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-secondary">{tr("Chủ tài khoản:")}</span>
                            <span className="font-semibold text-text-primary">HUYNH TUAN KHOA</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-border">
                            <span className="text-text-secondary">{tr("Nội dung:")}</span>
                            <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary">
                                DUT {activeDonation.orderCode}
                            </span>
                        </div>
                    </div>

                    {checkMessage && (
                        <p className="text-xs font-medium text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                            {checkMessage}
                        </p>
                    )}

                    <div className="space-y-2 pt-1">
                        <Button
                            className="w-full text-xs font-bold shadow-xs"
                            disabled={checking}
                            onClick={checkManual}
                        >
                            {checking ? tr("Đang kiểm tra…") : tr("Kiểm tra trạng thái thanh toán")}
                        </Button>
                        {user?.role === 'ADMIN' && (
                            <button
                                type="button"
                                disabled={checking}
                                className="w-full rounded-xl border border-amber-300 bg-amber-50 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs disabled:opacity-50"
                                onClick={async () => {
                                    setChecking(true);
                                    setCheckMessage(null);
                                    try {
                                        await api.adminSettle(activeDonation.donationId);
                                        setIsPaid(true);
                                        setCheckMessage(tr("Quản trị viên đã xác nhận thanh toán thành công!"));
                                        void queryClient.invalidateQueries({queryKey: ['campaign', campaign.id]});
                                        void queryClient.invalidateQueries({queryKey: ['financial-summary', campaign.id]});
                                        void queryClient.invalidateQueries({queryKey: ['campaign-dashboard', campaign.id]});
                                    } catch (e) {
                                        setCheckMessage(errorMessage(e));
                                    } finally {
                                        setChecking(false);
                                    }
                                }}
                            >
                                ⚡ {tr("Xác nhận đã nhận tiền (Dành cho Quản trị viên)")}
                            </button>
                        )}
                        <div className="flex items-center justify-between text-xs px-1">
                            <button
                                type="button"
                                className="text-text-secondary hover:text-rose-600 hover:underline"
                                onClick={() => {
                                    setActiveDonation(null);
                                    setCheckMessage(null);
                                }}
                            >
                                {tr("← Nhập số tiền khác")}
                            </button>
                            {activeDonation.checkoutUrl && (
                                <a
                                    href={activeDonation.checkoutUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-primary hover:underline"
                                >
                                    {tr("Mở trang thanh toán PayOS")} ↗
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <form
                        noValidate
                        className="space-y-4"
                        onSubmit={f.handleSubmit(({amount}) => {
                            const parsed = z
                                .string()
                                .trim()
                                .regex(/^[0-9]{1,19}$/, tr("Nhập số tiền VND nguyên"))
                                .safeParse(amount);
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

                        {mutation.isError && <ErrorState message={errorMessage(mutation.error)} />}

                        <Button type="submit" className="w-full font-bold shadow-xs" disabled={mutation.isPending}>
                            {mutation.isPending ? tr("Đang tạo mã VietQR…") : tr("Tạo mã VietQR ủng hộ")}
                        </Button>
                    </form>

                    <ConfirmDialog
                        open={confirm !== null}
                        title={tr("Xác nhận tạo mã quyên góp?")}
                        message={
                            confirm
                                ? `Bạn muốn quyên góp ${vnd(confirm)} cho chiến dịch này? Hệ thống sẽ tạo mã VietQR động ngay bên dưới để bạn quét chuyển khoản.`
                                : ''
                        }
                        confirmLabel={tr("Tạo mã QR")}
                        busy={mutation.isPending}
                        onClose={() => setConfirm(null)}
                        onConfirm={() => {
                            if (confirm) {
                                mutation.mutate(confirm, {
                                    onSuccess: r => {
                                        setConfirm(null);
                                        const orderCode = r.orderCode || r.donationId.substring(0, 15);
                                        let qrUrl = r.qrCodeUrl || `https://img.vietqr.io/image/MB-4310072005-compact2.png?amount=${confirm}&addInfo=${encodeURIComponent('DUT ' + orderCode)}&accountName=HUYNH+TUAN+KHOA`;
                                        if (r.checkoutUrl && r.checkoutUrl.includes('vietqr=')) {
                                            try {
                                                const parsed = new URL(r.checkoutUrl, window.location.origin);
                                                const vParam = parsed.searchParams.get('vietqr');
                                                if (vParam) qrUrl = vParam;
                                            } catch {
                                                // ignore
                                            }
                                        }
                                        setActiveDonation({
                                            donationId: r.donationId,
                                            amount: confirm,
                                            vietQrUrl: qrUrl,
                                            orderCode: orderCode,
                                            checkoutUrl: r.checkoutUrl || undefined,
                                            paymentId: r.paymentTransactionId,
                                        });
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
