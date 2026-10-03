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
    const [page, setPage] = useState(0);
    const q = useCoordinationQuery(['history', page], () => api.history(page));
    return <div className="space-y-6"><h1 className="text-3xl font-semibold">Lịch sử tình nguyện</h1><p>Các chiến dịch đã tham gia, điểm danh và kết quả hoàn thành được xác nhận.</p>{q.isPending ? <LoadingState/> : q.isError ?
        <ErrorState message={errorMessage(q.error)}/> : <>{!q.data.items.length &&
            <EmptyState message="Bạn chưa có chiến dịch được chấp nhận tham gia."/>}{q.data.items.map(v => <Card
            key={v.campaignId}><h2 className="break-words text-xl font-semibold"><Link
            className="text-primary hover:underline" to={'/campaigns/' + v.campaignSlug}>{v.campaignTitle}</Link></h2><Badge
            tone={v.completionStatus === 'VERIFIED' ? 'success' : 'neutral'}>{completionStatuses[v.completionStatus]}</Badge>
            <p>{tracks[v.assignedTrack]} · Buổi có mặt: {v.presentSessions} / {v.totalSessions}</p><p>Số giờ chính thức đã xác minh: {v.verifiedHours ?? 'Chưa xác minh'}</p>{v.verifiedAt &&
                <p>Đã xác minh {date(v.verifiedAt)}</p>}<p className="whitespace-pre-wrap break-words">{v.note}</p><Link
                className="text-primary hover:underline" to={'/me/campaigns/' + v.campaignId + '/meetings'}>Lịch họp chiến dịch</Link></Card>)}<Pagination {...q.data} onPageChange={setPage}/></>}</div>;
}
