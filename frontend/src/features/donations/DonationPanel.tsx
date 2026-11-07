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
    accountNumber?: string;
    accountName?: string;
    bankName?: string;
    isDirectPayos?: boolean;
}

export function DonationPanel({campaign}: { campaign: CampaignDetail }) {
    useLanguage();
    const {user, initialized} = useAuth();
    const settings = useDonationSettings();
    const queryClient = useQueryClient();
    const f = useForm<{amount: string}>({defaultValues: {amount: '100000'}});
    const [confirm, setConfirm] = useState<string | null>(null);
    const [activeDonation, setActiveDonation] = useState<ActiveDonation | null>(null);
    const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes limit
    const [checking, setChecking] = useState(false);
    const [checkMessage, setCheckMessage] = useState<string | null>(null);
    const [isPaid, setIsPaid] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const copyToClipboard = (text: string, fieldName: string) => {
        void navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const mutation = useDonationMutation((amount: string) => api.create(campaign.id, amount));

    // Reset 10-minute timer when activeDonation is set
    useEffect(() => {
        if (!activeDonation || isPaid) return;
        setSecondsLeft(600);
        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [activeDonation, isPaid]);

    // Realtime WebSocket listener for donation settlement (Zero polling)
    useEffect(() => {
        if (!activeDonation || isPaid) return;

        const onDonationEvent = (e: Event) => {
            const event = e as CustomEvent;
            const data = event.detail;
            if (!data) return;

            const isCurrentDonation =
                (data.donationId && data.donationId === activeDonation.donationId) ||
                (data.orderCode && data.orderCode === activeDonation.orderCode);

            if (isCurrentDonation) {
                setIsPaid(true);
                setCheckMessage(tr("Đã nhận được tiền ủng hộ thành công!"));
                if ('vibrate' in navigator) navigator.vibrate([100, 50, 200]);
                void queryClient.invalidateQueries({queryKey: ['campaign', campaign.id]});
                void queryClient.invalidateQueries({queryKey: ['financial-summary', campaign.id]});
                void queryClient.invalidateQueries({queryKey: ['campaign-dashboard', campaign.id]});
                void queryClient.invalidateQueries({queryKey: ['notifications']});
                void queryClient.invalidateQueries({queryKey: ['donations']});
                void queryClient.invalidateQueries({queryKey: ['me', 'donations']});
            }
        };

        window.addEventListener('app:donation_received', onDonationEvent);
        return () => {
            window.removeEventListener('app:donation_received', onDonationEvent);
        };
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
            <div className="flex items-center gap-2.5 mb-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    ₫
                </span>
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
            ) : activeDonation && secondsLeft <= 0 ? (
                <div className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50/80 p-5 text-center animate-in fade-in">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xl font-bold">
                        ⏱️
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-amber-900">{tr("Mã QR đã hết hạn")}</h4>
                        <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                            {tr("Thời gian thanh toán (10 phút) đã kết thúc. Vui lòng tạo mã QR mới để đảm bảo việc xử lý chính xác.")}
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        className="w-full text-xs font-bold shadow-xs"
                        onClick={() => {
                            setActiveDonation(null);
                            setSecondsLeft(600);
                            setCheckMessage(null);
                        }}
                    >
                        {tr("Tạo mã QR mới")}
                    </Button>
                </div>
            ) : activeDonation ? (
                <div className="space-y-4 rounded-2xl border-2 border-primary/30 bg-primary-light/20 p-4 text-center">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                            {activeDonation.isDirectPayos ? (
                                <>
                                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                                    {tr("Cổng PayOS Trực Tuyến")}
                                </>
                            ) : (
                                <>⚡ {tr("Mã VietQR tiếp sức")}</>
                            )}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            {tr("WebSocket Realtime")}
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

                    {/* 10-Minute Expiry Countdown Bar */}
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-white/90 border border-amber-200/80 px-3 py-1.5 text-xs text-amber-900 shadow-2xs">
                        <span>⏱️</span>
                        <span>{tr("Mã QR hết hạn sau:")}</span>
                        <span className="font-mono font-extrabold text-amber-700 text-sm">
                            {Math.floor(secondsLeft / 60).toString().padStart(2, '0')}:{(secondsLeft % 60).toString().padStart(2, '0')}
                        </span>
                    </div>

                    {activeDonation.isDirectPayos && activeDonation.checkoutUrl && (
                        <a
                            href={activeDonation.checkoutUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary-hover transition-colors shadow-xs"
                        >
                            <span>💳</span> {tr("Mở trang thanh toán PayOS (VietQR / Thẻ)")} ↗
                        </a>
                    )}

                    <div className="rounded-xl bg-white p-3 text-left text-xs space-y-2 border border-border/80">
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary">{tr("Số tiền:")}</span>
                            <strong className="text-sm font-bold text-primary">{vnd(activeDonation.amount)}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary">{tr("Ngân hàng:")}</span>
                            <span className="font-semibold text-text-primary">{activeDonation.bankName || "MB Bank"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary">{tr("Số tài khoản:")}</span>
                            <div className="flex items-center gap-1.5">
                                <span className="font-mono font-semibold text-text-primary select-all">
                                    {activeDonation.accountNumber || "4310072005"}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(activeDonation.accountNumber || "4310072005", "accountNumber")}
                                    className="rounded border border-border px-1.5 py-0.5 text-[10px] text-text-secondary hover:bg-surface-muted transition-colors"
                                    title={tr("Sao chép số tài khoản")}
                                >
                                    {copiedField === 'accountNumber' ? '✓ ' + tr("Đã chép") : tr("Chép")}
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-text-secondary">{tr("Chủ tài khoản:")}</span>
                            <span className="font-semibold text-text-primary">{activeDonation.accountName || "HUYNH TUAN KHOA"}</span>
                        </div>
                        <div className="flex justify-between items-center pt-1.5 border-t border-border">
                            <span className="text-text-secondary">{tr("Nội dung:")}</span>
                            <div className="flex items-center gap-1.5">
                                <span className="rounded bg-surface-muted px-2 py-0.5 font-mono text-[11px] font-bold text-primary select-all">
                                    DUT {activeDonation.orderCode}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(`DUT ${activeDonation.orderCode}`, "memo")}
                                    className="rounded border border-border px-1.5 py-0.5 text-[10px] text-text-secondary hover:bg-surface-muted transition-colors"
                                    title={tr("Sao chép nội dung chuyển khoản")}
                                >
                                    {copiedField === 'memo' ? '✓ ' + tr("Đã chép") : tr("Chép")}
                                </button>
                            </div>
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
                                        const isDirectPayos = Boolean(r.checkoutUrl && r.checkoutUrl.startsWith('https://pay.payos.vn'));
                                        setActiveDonation({
                                            donationId: r.donationId,
                                            amount: confirm,
                                            vietQrUrl: qrUrl,
                                            orderCode: orderCode,
                                            checkoutUrl: r.checkoutUrl || undefined,
                                            paymentId: r.paymentTransactionId,
                                            accountNumber: r.accountNumber || undefined,
                                            accountName: r.accountName || undefined,
                                            bankName: r.bankName || undefined,
                                            isDirectPayos,
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
