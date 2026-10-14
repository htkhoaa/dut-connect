import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useCoordinationQuery} from '../coordination/hooks';
import {date} from '../coordination/components';
import {completionStatuses, tracks} from '../coordination/types';
import {errorMessage} from '../../shared/api/errors';
import {Card} from '../../shared/components/Card';
import {Badge} from '../../shared/components/Badge';
import {Pagination} from '../../shared/components/Pagination';
import {ErrorState} from '../../shared/components/ErrorState';
import {LoadingState} from '../../shared/components/LoadingState';
import {EmptyState} from '../../shared/components/EmptyState';
import * as api from './completionApi';

export function HistoryPage() {
    useLanguage();
    const [page, setPage] = useState(0);
    const q = useCoordinationQuery(['history', page], () => api.history(page));
    return <div className="space-y-6"><h1 className="text-3xl font-semibold">{tr("Lịch sử tình nguyện")}</h1><p>{tr("Các chiến dịch đã tham gia, điểm danh và kết quả hoàn thành được xác nhận.")}</p>{renderText(q.isPending ? <LoadingState/> : q.isError ?
        <ErrorState message={errorMessage(q.error)}/> : <>{!q.data.items.length &&
            <EmptyState message={tr("Bạn chưa có chiến dịch được chấp nhận tham gia.")}/>}{q.data.items.map(v => <Card
            key={v.campaignId}><h2 className="break-words text-xl font-semibold"><Link
            className="text-primary hover:underline" to={'/campaigns/' + v.campaignSlug}>{renderText(v.campaignTitle)}</Link></h2><Badge
            tone={v.completionStatus === 'VERIFIED' ? 'success' : 'neutral'}>{renderText(completionStatuses[v.completionStatus])}</Badge>
            <p>{renderText(tracks[v.assignedTrack])}{tr("· Buổi có mặt:")}{renderText(v.presentSessions)} / {renderText(v.totalSessions)}</p><p>{tr("Số giờ chính thức đã xác minh:")}{renderText(v.verifiedHours ?? tr("Chưa xác minh"))}</p>{renderText(v.verifiedAt &&
                <p>{tr("Đã xác minh")}{renderText(date(v.verifiedAt))}</p>)}<p className="whitespace-pre-wrap break-words">{renderText(v.note)}</p><Link
                className="text-primary hover:underline" to={'/me/campaigns/' + v.campaignId + '/meetings'}>{tr("Lịch họp chiến dịch")}</Link></Card>)}<Pagination {...q.data} onPageChange={setPage}/></>)}</div>;
}
