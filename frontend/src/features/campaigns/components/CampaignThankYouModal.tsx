import {useState} from 'react';
import {useQuery, useMutation} from '@tanstack/react-query';
import {useLanguage, tr} from '../../../shared/lib/i18n';
import {Dialog} from '../../../shared/components/Dialog';
import {Button} from '../../../shared/components/Button';
import {Icon} from '../../../shared/components/Icon';
import {Badge} from '../../../shared/components/Badge';
import {LoadingState} from '../../../shared/components/LoadingState';
import {ErrorState} from '../../../shared/components/ErrorState';
import {errorMessage} from '../../../shared/api/errors';
import type {ContributionMode} from '../types';
import {
    getThankYouRecipients,
    sendThankYou,
    getCertificatePreviewSvg,
    type ThankYouRecipient,
    type CampaignThankYouResponse
} from '../thankYouApi';

interface Props {
    open: boolean;
    campaignId: string;
    campaignTitle: string;
    mode?: ContributionMode;
    onClose: () => void;
}

export function CampaignThankYouModal({open, campaignId, campaignTitle, mode, onClose}: Props) {
    useLanguage();
    const [tab, setTab] = useState<'recipients' | 'certificate' | 'message'>('recipients');
    const [certType, setCertType] = useState<'DONATION' | 'VOLUNTEER'>(mode === 'VOLUNTEER_ONLY' ? 'VOLUNTEER' : 'DONATION');
    const [recipientFilter, setRecipientFilter] = useState<'ALL' | 'DONATION' | 'VOLUNTEER'>('ALL');
    const [customSubject, setCustomSubject] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [sentResult, setSentResult] = useState<CampaignThankYouResponse | null>(null);

    const recipientsQuery = useQuery({
        queryKey: ['campaign-thank-you-recipients', campaignId],
        queryFn: () => getThankYouRecipients(campaignId),
        enabled: open && !sentResult,
    });

    const previewQuery = useQuery({
        queryKey: ['campaign-cert-preview', campaignId, certType],
        queryFn: () => getCertificatePreviewSvg(campaignId, certType),
        enabled: open,
    });

    const sendMutation = useMutation({
        mutationFn: () => sendThankYou(campaignId, customSubject || undefined, customMessage || undefined),
        onSuccess: (data) => {
            setSentResult(data);
        },
    });

    if (!open) return null;

    const data = recipientsQuery.data;
    const allRecipients: ThankYouRecipient[] = [
        ...(data?.donors ?? []),
        ...(data?.volunteers ?? [])
    ];

    const filteredRecipients = allRecipients.filter(r => {
        if (recipientFilter === 'ALL') return true;
        return r.contributionType === recipientFilter;
    });

    const totalCount = allRecipients.length;

    const handleDownloadCert = () => {
        if (!previewQuery.data?.svg) return;
        const blob = new Blob([previewQuery.data.svg], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Giay-chung-nhan-DUT-${certType.toLowerCase()}-${campaignTitle.slice(0, 20)}.svg`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Dialog
            open={open}
            title={tr("Gửi lời cảm ơn & Chứng chỉ xác nhận")}
            onClose={onClose}
            busy={sendMutation.isPending}
            className="max-w-4xl max-h-[90vh] overflow-y-auto"
        >
            {sentResult ? (
                /* Success View */
                <div className="py-6 text-center space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
                        ✓
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">
                        {tr("Đã gửi lời cảm ơn thành công!")}
                    </h3>
                    <p className="max-w-xl mx-auto text-sm text-text-secondary leading-relaxed">
                        {sentResult.message}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto py-2">
                        <div className="rounded-xl border border-border bg-surface-muted p-3">
                            <p className="text-xs text-text-secondary">{tr("Ủng hộ tài chính")}</p>
                            <p className="text-xl font-bold text-primary">{sentResult.donorsCount}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-surface-muted p-3">
                            <p className="text-xs text-text-secondary">{tr("Tình nguyện viên")}</p>
                            <p className="text-xl font-bold text-emerald-600">{sentResult.volunteersCount}</p>
                        </div>
                        <div className="rounded-xl border border-border bg-surface-muted p-3">
                            <p className="text-xs text-text-secondary">{tr("Tổng email đã gửi")}</p>
                            <p className="text-xl font-bold text-text-primary">{sentResult.totalSent}</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-800 text-left max-w-xl mx-auto space-y-1">
                        <p className="font-semibold flex items-center gap-1.5">
                            <Icon name="check" size={15} />
                            {tr("Chứng chỉ Trường Đại học Bách khoa đã được đính kèm vào email:")}
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-emerald-700">
                            <li>{tr("Sinh viên ủng hộ: nhận Chứng chỉ đóng góp tài chính kèm dấu đỏ & chữ ký.")}</li>
                            <li>{tr("Sinh viên tình nguyện: nhận Chứng chỉ tình nguyện viên kèm số giờ đóng góp.")}</li>
                            <li>{tr("Thông báo in-app realtime cũng đã được chuyển đến tài khoản sinh viên.")}</li>
                        </ul>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button variant="primary" onClick={onClose}>
                            {tr("Hoàn tất & Đóng")}
                        </Button>
                    </div>
                </div>
            ) : recipientsQuery.isPending ? (
                <LoadingState message={tr("Đang tổng hợp danh sách sinh viên đóng góp…")} />
            ) : recipientsQuery.isError ? (
                <ErrorState message={errorMessage(recipientsQuery.error)} onRetry={() => void recipientsQuery.refetch()} />
            ) : (
                <div className="space-y-5">
                    {/* Summary statistics bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">💰</span>
                                <div>
                                    <p className="text-xs text-text-secondary font-medium">{tr("Sinh viên ủng hộ tài chính")}</p>
                                    <p className="text-xl font-bold text-primary">{data?.donorsCount ?? 0} {tr("bạn")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🤝</span>
                                <div>
                                    <p className="text-xs text-text-secondary font-medium">{tr("Tình nguyện viên tham gia")}</p>
                                    <p className="text-xl font-bold text-emerald-700">{data?.volunteersCount ?? 0} {tr("bạn")}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">💌</span>
                                <div>
                                    <p className="text-xs text-text-secondary font-medium">{tr("Tổng sinh viên sẽ tri ân")}</p>
                                    <p className="text-xl font-bold text-amber-700">{totalCount} {tr("sinh viên")}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation tabs */}
                    <div className="flex flex-wrap gap-2 border-b border-border pb-3">
                        <button
                            type="button"
                            onClick={() => setTab('recipients')}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                tab === 'recipients'
                                    ? 'bg-primary text-white shadow-2xs'
                                    : 'bg-surface-muted text-text-secondary hover:bg-surface-muted/80'
                            }`}
                        >
                            👥 {tr("Danh sách nhận tri ân")} ({totalCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('certificate')}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                tab === 'certificate'
                                    ? 'bg-primary text-white shadow-2xs'
                                    : 'bg-surface-muted text-text-secondary hover:bg-surface-muted/80'
                            }`}
                        >
                            🎖️ {tr("Xem trước chứng chỉ DUT")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('message')}
                            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                                tab === 'message'
                                    ? 'bg-primary text-white shadow-2xs'
                                    : 'bg-surface-muted text-text-secondary hover:bg-surface-muted/80'
                            }`}
                        >
                            ✍️ {tr("Nội dung thư cảm ơn")}
                        </button>
                    </div>

                    {/* Tab 1: Recipients List */}
                    {tab === 'recipients' && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setRecipientFilter('ALL')}
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                            recipientFilter === 'ALL'
                                                ? 'bg-text-primary text-surface'
                                                : 'bg-surface-muted text-text-secondary hover:bg-border'
                                        }`}
                                    >
                                        {tr("Tất cả")} ({totalCount})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRecipientFilter('DONATION')}
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                            recipientFilter === 'DONATION'
                                                ? 'bg-primary text-white'
                                                : 'bg-surface-muted text-text-secondary hover:bg-border'
                                        }`}
                                    >
                                        {tr("Ủng hộ tài chính")} ({data?.donorsCount ?? 0})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRecipientFilter('VOLUNTEER')}
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                            recipientFilter === 'VOLUNTEER'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-surface-muted text-text-secondary hover:bg-border'
                                        }`}
                                    >
                                        {tr("Tình nguyện viên")} ({data?.volunteersCount ?? 0})
                                    </button>
                                </div>
                                <span className="text-xs text-text-secondary">
                                    {tr("Kèm chứng chỉ xác nhận có chữ ký & con dấu")}
                                </span>
                            </div>

                            {filteredRecipients.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-text-secondary">
                                    {tr("Không có sinh viên nào trong mục này.")}
                                </div>
                            ) : (
                                <div className="max-h-64 overflow-y-auto rounded-xl border border-border">
                                    <table className="w-full text-left text-xs">
                                        <thead className="sticky top-0 bg-surface-muted border-b border-border text-text-secondary">
                                            <tr>
                                                <th className="p-2.5 font-semibold">{tr("Họ và tên")}</th>
                                                <th className="p-2.5 font-semibold">{tr("MSSV")}</th>
                                                <th className="p-2.5 font-semibold">{tr("Email")}</th>
                                                <th className="p-2.5 font-semibold">{tr("Hình thức")}</th>
                                                <th className="p-2.5 font-semibold text-right">{tr("Chi tiết")}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/60">
                                            {filteredRecipients.map((r, i) => (
                                                <tr key={r.userId + '-' + r.contributionType + '-' + i} className="hover:bg-surface-muted/50">
                                                    <td className="p-2.5 font-medium text-text-primary">{r.fullName}</td>
                                                    <td className="p-2.5 font-mono text-text-secondary">{r.studentId}</td>
                                                    <td className="p-2.5 text-text-secondary truncate max-w-[150px]">{r.email}</td>
                                                    <td className="p-2.5">
                                                        <Badge tone={r.contributionType === 'DONATION' ? 'neutral' : 'success'}>
                                                            {r.contributionType === 'DONATION' ? tr("Ủng hộ tài chính") : tr("Tình nguyện viên")}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-2.5 font-semibold text-right text-text-primary">{r.detail}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Certificate Preview */}
                    {tab === 'certificate' && (
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-muted p-2.5 rounded-xl">
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCertType('DONATION')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                            certType === 'DONATION'
                                                ? 'bg-primary text-white shadow-xs'
                                                : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        💰 {tr("Mẫu: Chứng chỉ Ủng hộ tài chính")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCertType('VOLUNTEER')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                            certType === 'VOLUNTEER'
                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                : 'text-text-secondary hover:text-text-primary'
                                        }`}
                                    >
                                        🤝 {tr("Mẫu: Chứng chỉ Tham gia tình nguyện")}
                                    </button>
                                </div>

                                <Button variant="secondary" onClick={handleDownloadCert} className="text-xs py-1 px-2.5">
                                    <Icon name="file" size={14} />
                                    {tr("Tải file SVG mẫu")}
                                </Button>
                            </div>

                            {previewQuery.isPending ? (
                                <LoadingState message={tr("Đang kết xuất chứng chỉ DUT…")} />
                            ) : previewQuery.isError ? (
                                <ErrorState message={errorMessage(previewQuery.error)} />
                            ) : previewQuery.data?.svg ? (
                                <div className="overflow-hidden rounded-xl border border-border bg-white shadow-md p-1">
                                    <div
                                        className="w-full aspect-[16/11] max-h-[380px] overflow-hidden flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                                        dangerouslySetInnerHTML={{__html: previewQuery.data.svg}}
                                    />
                                    <div className="bg-surface-muted/60 p-2.5 text-center text-xs text-text-secondary border-t border-border flex items-center justify-center gap-1.5">
                                        <Icon name="check" size={14} className="text-emerald-600" />
                                        <span>{tr("Mỗi sinh viên sẽ nhận được chứng chỉ cá nhân hóa với họ tên, MSSV, đóng góp cụ thể và con dấu đỏ Trường ĐH Bách khoa.")}</span>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Tab 3: Message Customization */}
                    {tab === 'message' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1">
                                    {tr("Tiêu đề email cảm ơn (Tùy chọn)")}
                                </label>
                                <input
                                    type="text"
                                    value={customSubject}
                                    onChange={(e) => setCustomSubject(e.target.value)}
                                    placeholder={`[DUT Connect] Thư cảm ơn & Chứng nhận tham gia: ${campaignTitle}`}
                                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-text-secondary mb-1">
                                    {tr("Lời nhắn riêng từ Ban Tổ chức (Tùy chọn)")}
                                </label>
                                <textarea
                                    rows={4}
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    placeholder={tr("Nhập thêm lời nhắn gửi, lời chúc hoặc ghi chú đặc biệt từ Ban Tổ chức gửi đến các bạn sinh viên...")}
                                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary/90 space-y-1">
                                <p className="font-semibold">{tr("Cấu trúc email được gửi tự động:")}</p>
                                <p>• {tr("Thư cảm ơn trang trọng với nhận diện thương hiệu Trường Đại học Bách khoa - ĐHĐN.")}</p>
                                <p>• {tr("Kèm hình ảnh Giấy chứng nhận tham gia chính thức (đính kèm tệp PNG và hiển thị trong email).")}</p>
                                <p>• {tr("Gửi thông báo realtime đến chuông thông báo trong ứng dụng.")}</p>
                            </div>
                        </div>
                    )}

                    {/* Action buttons footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                        <div className="text-xs text-text-secondary">
                            {totalCount > 0 ? (
                                <span>{tr("Sẵn sàng gửi email đến")} <strong>{totalCount}</strong> {tr("sinh viên.")}</span>
                            ) : (
                                <span>{tr("Chưa ghi nhận sinh viên đóng góp cho chiến dịch này.")}</span>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={onClose} disabled={sendMutation.isPending}>
                                {tr("Hủy")}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => sendMutation.mutate()}
                                disabled={sendMutation.isPending || totalCount === 0}
                                className="font-semibold shadow-xs"
                            >
                                {sendMutation.isPending ? (
                                    <span className="flex items-center gap-1.5">
                                        <Icon name="clock" size={14} className="animate-spin" />
                                        {tr("Đang gửi email & chứng chỉ…")}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5">
                                        💌 {tr("Gửi thư cảm ơn & Chứng chỉ")} ({totalCount})
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Dialog>
    );
}
