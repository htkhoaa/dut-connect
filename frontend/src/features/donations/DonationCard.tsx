import {useLanguage, tr, renderText, locale} from "../../shared/lib/i18n";
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
    useLanguage();
    const refresh = useDonationMutation((id: string) => api.refresh(id));
    const p = d.payments[0];
    const pending = d.status === 'CREATED' || d.status === 'PENDING_PAYMENT';
    const link = pending ? checkoutLink(p?.checkoutUrl || null) : null;

    let vietQrImgUrl: string | null = null;
    if (p?.checkoutUrl && p.checkoutUrl.includes('vietqr=')) {
        try {
            const urlObj = new URL(p.checkoutUrl, window.location.origin);
            vietQrImgUrl = urlObj.searchParams.get('vietqr');
        } catch {
            const match = p.checkoutUrl.match(/vietqr=([^&]+)/);
            if (match) vietQrImgUrl = decodeURIComponent(match[1]);
        }
    }
    if (!vietQrImgUrl && typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        vietQrImgUrl = urlParams.get('vietqr');
    }

    return <Card>
        <div className="flex flex-wrap justify-between gap-3"><h2 className="break-words text-xl font-semibold"><Link
            className="text-primary hover:opacity-80" to={'/campaigns/' + d.campaignSlug}>{renderText(d.campaignTitle)}</Link></h2><Badge
            tone={donationStatuses[d.status].tone}>{renderText(donationStatuses[d.status].label)}</Badge></div>
        <p className="mt-3 text-lg font-semibold text-primary">{renderText(vnd(d.amount))}</p>
        <p className="text-xs text-text-secondary">{tr("Ngày tạo: ")}{renderText(new Date(d.createdAt).toLocaleString(locale()))}</p>
        {renderText(p?.paidAt && <p className="text-xs text-success font-medium">{tr("Đã thanh toán lúc: ")}{renderText(new Date(p.paidAt).toLocaleString(locale()))}</p>)}
        {renderText(p?.failureReason && <p role="status" className="break-words text-xs text-danger">{renderText(p.failureReason)}</p>)}

        {pending && vietQrImgUrl && (
            <div className="mt-4 p-5 bg-primary-light/40 rounded-2xl border border-primary-muted text-center space-y-3">
                <p className="font-semibold text-primary text-sm">📱 {tr("Quét mã VietQR bằng bất kỳ ứng dụng ngân hàng nào để ủng hộ:")}</p>
                <div className="flex justify-center">
                    <img src={vietQrImgUrl} alt="VietQR" className="h-64 w-64 object-contain rounded-xl border border-border bg-white p-2 shadow-xs" />
                </div>
                <p className="text-xs text-text-secondary">{tr("Nội dung chuyển khoản đã được tạo tự động. Sau khi chuyển tiền, bấm 'Làm mới trạng thái' bên dưới.")}</p>
            </div>
        )}

        {renderText(pending && !vietQrImgUrl &&
        <p className="mt-3 text-xs text-text-secondary">{tr("Kết quả thanh toán được xác nhận từ hệ thống. Làm mới để xem trạng thái mới nhất.")}</p>)}
        <div className="mt-4 flex flex-wrap gap-4"><Link className="ui-button ui-button-secondary"
                                                         to={'/payment/result?donationId=' + d.id}>{tr("Kết quả thanh toán")}</Link>{renderText(link && (link.startsWith('/') ?
            <Link className="ui-button ui-button-primary" to={link}>{tr("Mở trang thanh toán")}</Link> :
            <a className="ui-button ui-button-primary" href={link} rel="noreferrer">{tr("Mở cổng thanh toán")}</a>))}{renderText(pending && p && <Button disabled={refresh.isPending}
                                                       onClick={() => refresh.mutate(p.id)}>{renderText(refresh.isPending ? tr("Đang làm mới…") : tr("Làm mới trạng thái"))}</Button>)}
        </div>
        {renderText(refresh.isError && <ErrorState message={errorMessage(refresh.error)}/>)}</Card>;
}
