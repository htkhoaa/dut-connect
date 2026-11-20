import { useLanguage, tr, renderText } from '../../../shared/lib/i18n';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCoordinationQuery } from '../../coordination/hooks';
import * as attendanceApi from '../../attendance/api';
import { date } from '../../coordination/components';
import { type Session } from '../../coordination/types';
import { Card } from '../../../shared/components/Card';
import { Button } from '../../../shared/components/Button';
import { Dialog } from '../../../shared/components/Dialog';
import { Pagination } from '../../../shared/components/Pagination';
import { LoadingState } from '../../../shared/components/LoadingState';
import { EmptyState } from '../../../shared/components/EmptyState';
import { ErrorState } from '../../../shared/components/ErrorState';
import { errorMessage } from '../../../shared/api/errors';

export function AttendanceTab({
    campaignId,
    canManage,
    canOperate = true,
}: {
    campaignId: string;
    canManage: boolean;
    canOperate?: boolean;
}) {
    useLanguage();
    const [page, setPage] = useState(0);
    const [qrModal, setQrModal] = useState<{
        title: string;
        qrImageUrl: string;
        checkinUrl: string;
    } | null>(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [qrError, setQrError] = useState('');

    const q = useCoordinationQuery(['sessions', campaignId, page], () =>
        attendanceApi.list(campaignId, page),
    );

    const handleGenerateQr = async (s: Session) => {
        try {
            setQrLoading(true);
            setQrError('');
            const res = await attendanceApi.generateQr(s.id);
            await q.refetch();
            const fullCheckinUrl = window.location.origin + res.checkinUrl;
            setQrModal({
                title: s.title,
                qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(fullCheckinUrl)}`,
                checkinUrl: fullCheckinUrl,
            });
        } catch (error) {
            setQrError(errorMessage(error));
        } finally {
            setQrLoading(false);
        }
    };

    if (q.isPending) return <LoadingState />;
    if (q.isError)
        return <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />;

    const items = q.data?.items || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-text-primary">
                        {tr('Buổi điểm danh hoạt động')}
                    </h2>
                    <p className="mt-1 text-xs text-text-secondary">
                        {canManage
                            ? tr(
                                  'Tạo mã QR trình chiếu trên màn hình để tình nguyện viên quét điểm danh.',
                              )
                            : tr(
                                  'Quét mã QR do ban tổ chức cung cấp trong buổi hoạt động để xác nhận tham gia.',
                              )}
                    </p>
                </div>
                {canOperate && (
                    <div className="flex items-center gap-2">
                        <Link
                            to="/attendance/checkin"
                            className="ui-button ui-button-secondary text-xs"
                        >
                            📱 {tr('Nhập mã / Điểm danh')}
                        </Link>
                        {canManage && (
                            <Link
                                to={`/manage/campaigns/${campaignId}/attendance`}
                                className="ui-button ui-button-primary text-xs"
                            >
                                + {tr('Tạo buổi điểm danh')}
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {qrError && <ErrorState message={qrError} />}
            {!canOperate && (
                <p className="text-sm text-text-secondary">
                    {tr('Chiến dịch hiện chỉ cho phép xem.')}
                </p>
            )}
            {items.length === 0 ? (
                <EmptyState message={tr('Chưa có buổi điểm danh nào được thiết lập.')} />
            ) : (
                <div className="space-y-4">
                    {items.map((s) => (
                        <Card
                            key={s.id}
                            className="p-5 flex flex-wrap items-center justify-between gap-4"
                        >
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-text-primary">{s.title}</h3>
                                <p className="text-xs text-text-secondary">
                                    📅 {renderText(date(s.startsAt))} – {renderText(date(s.endsAt))}
                                </p>
                            </div>

                            {canOperate && (
                                <div className="flex items-center gap-2">
                                    {canManage ? (
                                        <Button
                                            variant="secondary"
                                            className="text-xs"
                                            disabled={qrLoading}
                                            onClick={() => handleGenerateQr(s)}
                                        >
                                            📱 {tr('Chiếu mã QR')}
                                        </Button>
                                    ) : (
                                        <Link
                                            to="/attendance/checkin"
                                            className="ui-button ui-button-primary text-xs"
                                        >
                                            ✓ {tr('Điểm danh ngay')}
                                        </Link>
                                    )}
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {q.data && <Pagination {...q.data} onPageChange={setPage} />}

            {qrModal && (
                <Dialog open={true} title={tr('Mã QR Điểm Danh')} onClose={() => setQrModal(null)}>
                    <div className="space-y-4 text-center">
                        <p className="font-semibold text-text-primary">{qrModal.title}</p>
                        <p className="text-xs text-text-secondary">
                            {tr(
                                'Trình chiếu mã này trên màn hình hoặc máy chiếu để tình nguyện viên dùng điện thoại quét:',
                            )}
                        </p>
                        <div className="flex justify-center p-3">
                            <div className="rounded-2xl border border-border bg-white p-3 shadow-lg">
                                <img
                                    src={qrModal.qrImageUrl}
                                    alt="QR điểm danh"
                                    className="h-72 w-72 rounded-xl object-contain"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-text-secondary font-mono break-all bg-surface-muted p-2 rounded-lg">
                            {qrModal.checkinUrl}
                        </p>
                        <div className="pt-2 flex justify-end">
                            <Button variant="secondary" onClick={() => setQrModal(null)}>
                                {tr('Đóng')}
                            </Button>
                        </div>
                    </div>
                </Dialog>
            )}
        </div>
    );
}
