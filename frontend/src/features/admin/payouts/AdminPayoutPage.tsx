import {useLanguage, tr, renderText} from "../../../shared/lib/i18n";
import {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {apiClient} from '../../../shared/api/client';
import {vnd} from '../../campaigns/presentation';
import {Card} from '../../../shared/components/Card';
import {Badge} from '../../../shared/components/Badge';
import {Button} from '../../../shared/components/Button';
import {LoadingState} from '../../../shared/components/LoadingState';
import {ErrorState} from '../../../shared/components/ErrorState';
import {Dialog} from '../../../shared/components/Dialog';
import {errorMessage} from '../../../shared/api/errors';

export interface PayoutCampaign {
    id: string;
    slug: string;
    title: string;
    organizerName: string;
    primaryContactName: string;
    donationBankName: string | null;
    donationAccountNumber: string | null;
    donationAccountHolder: string | null;
    fundraisingGoal: string;
    currentBalance: string;
    campaignStatus: string;
    payoutStatus: 'PENDING_FUNDS' | 'GOAL_REACHED' | 'READY_FOR_PAYOUT' | 'PAID_OUT' | string;
    payoutAmount: string;
    payoutTransferredAt: string | null;
    payoutNote: string | null;
    hasPayoutReceipt: boolean;
    version: number;
}

const payoutStatusConfig: Record<string, {label: string; tone: 'neutral' | 'danger' | 'success'}> = {
    PENDING_FUNDS: {label: 'Đang quyên góp', tone: 'neutral'},
    GOAL_REACHED: {label: 'Đã đạt mục tiêu', tone: 'neutral'},
    READY_FOR_PAYOUT: {label: 'Đã kết thúc - Chờ giải ngân', tone: 'danger'},
    PAID_OUT: {label: 'Đã giải ngân', tone: 'success'},
};

export function AdminPayoutPage() {
    useLanguage();
    const queryClient = useQueryClient();
    const [selected, setSelected] = useState<PayoutCampaign | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const {data, isPending, isError, error, refetch} = useQuery({
        queryKey: ['admin', 'payouts'],
        queryFn: async () => (await apiClient.get<PayoutCampaign[]>('/admin/campaign-payouts')).data,
    });

    const payoutMutation = useMutation({
        mutationFn: async ({id, amount, note, version, file}: {id: string; amount: string; note: string; version: number; file: File | null}) => {
            const formData = new FormData();
            formData.append('amount', amount);
            formData.append('version', String(version));
            if (note) formData.append('note', note);
            if (file) formData.append('receipt', file);
            return (await apiClient.post(`/admin/campaigns/${id}/payout`, formData, {
                headers: {'Content-Type': 'multipart/form-data'}
            })).data;
        },
        onSuccess: async () => {
            setSelected(null);
            setReceiptFile(null);
            setAmount('');
            setNote('');
            await queryClient.invalidateQueries({queryKey: ['admin', 'payouts']});
        },
        onError: (err) => {
            setActionError(errorMessage(err));
        }
    });

    const openPayoutModal = (item: PayoutCampaign) => {
        setSelected(item);
        setAmount(item.currentBalance);
        setNote(`Giải ngân tiền quyên góp cho chiến dịch ${item.title}`);
        setReceiptFile(null);
        setActionError(null);
    };

    const handleConfirmPayout = () => {
        if (!selected) return;
        payoutMutation.mutate({
            id: selected.id,
            amount,
            note,
            version: selected.version,
            file: receiptFile,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                    <p className="eyebrow mb-1 text-primary">{tr("QUẢN TRỊ HỆ THỐNG")}</p>
                    <h1 className="text-3xl font-bold">{tr("Quản lý giải ngân quyên góp (Payout)")}</h1>
                    <p className="mt-1 text-sm text-text-secondary">
                        {tr("Theo dõi số tiền quyên góp thực tế và xác nhận chuyển tiền giải ngân cho người đại diện chiến dịch.")}
                    </p>
                </div>
                <Button variant="secondary" onClick={() => void refetch()} disabled={isPending}>
                    {tr("Làm mới danh sách")}
                </Button>
            </div>

            <Card>
                {renderText(isPending ? (
                    <LoadingState message={tr("Đang tải danh sách giải ngân…")} />
                ) : isError ? (
                    <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
                ) : !data || data.length === 0 ? (
                    <p className="py-8 text-center text-text-secondary">{tr("Chưa có chiến dịch gây quỹ nào.")}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-border text-xs font-semibold uppercase text-text-secondary">
                                    <th className="py-3 px-3">{tr("Tên Campaign / Người tạo")}</th>
                                    <th className="py-3 px-3">{tr("Thông tin giải ngân")}</th>
                                    <th className="py-3 px-3">{tr("Mục tiêu")}</th>
                                    <th className="py-3 px-3">{tr("Số tiền hiện tại")}</th>
                                    <th className="py-3 px-3">{tr("Trạng thái")}</th>
                                    <th className="py-3 px-3 text-right">{tr("Thao tác")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {data.map((item) => {
                                    const statusCfg = payoutStatusConfig[item.payoutStatus] || {
                                        label: item.payoutStatus,
                                        tone: 'neutral' as const
                                    };
                                    const isEnded = ['COMPLETED', 'CLOSED', 'ENDED'].includes(item.campaignStatus) || item.payoutStatus === 'READY_FOR_PAYOUT';
                                    const hasBalance = BigInt(item.currentBalance || '0') > 0n;
                                    return (
                                        <tr key={item.id} className="hover:bg-surface-muted/50 transition-colors">
                                            <td className="py-3.5 px-3">
                                                <p className="font-semibold text-text-primary">{item.title}</p>
                                                <p className="text-xs text-text-secondary mt-0.5">
                                                    {item.organizerName} {item.primaryContactName ? `· ${item.primaryContactName}` : ''}
                                                </p>
                                            </td>
                                            <td className="py-3.5 px-3">
                                                {item.donationAccountNumber ? (
                                                    <div className="text-xs space-y-0.5">
                                                        <p className="font-medium text-text-primary">
                                                            {item.donationBankName || tr("Ngân hàng")}
                                                        </p>
                                                        <p className="font-mono text-primary font-bold">
                                                            {item.donationAccountNumber}
                                                        </p>
                                                        <p className="text-text-secondary uppercase">
                                                            {item.donationAccountHolder || ''}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs italic text-text-secondary">{tr("Chưa cập nhật STK")}</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-3 whitespace-nowrap font-medium text-text-secondary">
                                                {item.fundraisingGoal && BigInt(item.fundraisingGoal) > 0n ? vnd(item.fundraisingGoal) : tr("Không đặt")}
                                            </td>
                                            <td className="py-3.5 px-3 whitespace-nowrap font-bold text-primary">
                                                {vnd(item.currentBalance)}
                                            </td>
                                            <td className="py-3.5 px-3 whitespace-nowrap">
                                                <Badge tone={statusCfg.tone}>{renderText(tr(statusCfg.label))}</Badge>
                                            </td>
                                            <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                                {item.payoutStatus === 'PAID_OUT' ? (
                                                    <div className="inline-flex items-center gap-2">
                                                        <span className="text-xs text-success font-semibold">✓ {tr("Đã giải ngân")}</span>
                                                        {item.hasPayoutReceipt && (
                                                            <a
                                                                href={`/api/v1/campaigns/${item.id}/payout-receipt`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary-light"
                                                            >
                                                                {tr("Xem biên lai")}
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex flex-col items-end gap-1">
                                                        <Button
                                                            variant="primary"
                                                            onClick={() => openPayoutModal(item)}
                                                            disabled={!isEnded || !hasBalance}
                                                            title={!isEnded ? tr("Chỉ giải ngân khi chiến dịch kết thúc") : !hasBalance ? tr("Số dư hiện tại bằng 0") : undefined}
                                                        >
                                                            {tr("Giải ngân")}
                                                        </Button>
                                                        {!isEnded && (
                                                            <span className="text-[10px] text-text-muted italic">
                                                                {tr("Chờ kết thúc chiến dịch")}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ))}
            </Card>

            {/* MODAL XÁC NHẬN GIẢI NGÂN */}
            {selected && (
                <Dialog open={true} title={tr("Xác nhận giải ngân cho chiến dịch")} onClose={() => setSelected(null)}>
                    <div className="space-y-4">
                        <div className="rounded-xl border border-primary-muted bg-primary-light p-4 text-sm space-y-2">
                            <p className="font-semibold text-primary">{selected.title}</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-text-secondary">{tr("Số tiền gom được:")} </span>
                                    <strong className="text-primary font-bold text-sm">{vnd(selected.currentBalance)}</strong>
                                </div>
                                <div>
                                    <span className="text-text-secondary">{tr("Chủ tài khoản:")} </span>
                                    <strong>{selected.donationAccountHolder || tr("Chưa có")}</strong>
                                </div>
                                <div>
                                    <span className="text-text-secondary">{tr("Ngân hàng:")} </span>
                                    <strong>{selected.donationBankName || tr("Chưa có")}</strong>
                                </div>
                                <div>
                                    <span className="text-text-secondary">{tr("Số tài khoản:")} </span>
                                    <strong className="font-mono text-primary font-bold">{selected.donationAccountNumber || tr("Chưa có")}</strong>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-text-secondary" htmlFor="payout-amount">
                                {tr("Số tiền giải ngân (VND)")}
                            </label>
                            <input
                                id="payout-amount"
                                type="text"
                                inputMode="numeric"
                                className="w-full rounded-xl border border-border p-2.5 text-sm"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-text-secondary" htmlFor="payout-receipt">
                                {tr("Biên lai chuyển khoản thành công (ảnh chụp màn hình)")}
                            </label>
                            <input
                                id="payout-receipt"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                className="block w-full text-xs text-text-secondary file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-light file:text-primary hover:file:bg-primary-muted cursor-pointer"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-text-secondary" htmlFor="payout-note">
                                {tr("Ghi chú minh chứng (tùy chọn)")}
                            </label>
                            <textarea
                                id="payout-note"
                                rows={2}
                                className="w-full rounded-xl border border-border p-2.5 text-sm"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                        </div>

                        {actionError && (
                            <p role="alert" className="text-xs text-danger font-medium">{actionError}</p>
                        )}

                        <div className="flex justify-end gap-3 pt-3 border-t border-border">
                            <Button variant="secondary" onClick={() => setSelected(null)} disabled={payoutMutation.isPending}>
                                {tr("Hủy")}
                            </Button>
                            <Button variant="primary" onClick={handleConfirmPayout} disabled={payoutMutation.isPending || !amount}>
                                {renderText(payoutMutation.isPending ? tr("Đang xử lý…") : tr("Xác nhận đã giải ngân"))}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            )}
        </div>
    );
}
