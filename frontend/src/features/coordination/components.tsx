import {Link} from 'react-router-dom';
import type {ReactNode} from 'react';
import {useState} from 'react';
import {useApplications} from '../volunteers/hooks';
import {Pagination} from '../../shared/components/Pagination';
import {ErrorState} from '../../shared/components/ErrorState';
import {LoadingState} from '../../shared/components/LoadingState';
import {errorMessage} from '../../shared/api/errors';

export function WorkspaceLinks({id}: { id: string }) {
    return <nav
        className="flex flex-wrap gap-4">{[['', 'Không gian làm việc'], ['/team', 'Đội tình nguyện'], ['/meetings', 'Lịch họp'], ['/tasks', 'Nhiệm vụ'], ['/attendance', 'Điểm danh'], ['/completions', 'Hoàn thành'], ['/finance', 'Tài chính']].map(([suffix, label]) =>
        <Link className="text-primary hover:underline" key={suffix}
              to={'/manage/campaigns/' + id + suffix}>{label}</Link>)}</nav>;
}

export function Field({label, error, children}: { label: string; error?: string; children: ReactNode }) {
    return <label className="block space-y-2"><span className="block font-medium">{label}</span>{children}{error &&
        <span role="alert" className="block text-danger">{error}</span>}</label>;
}

export function Roster({campaignId, render}: {
    campaignId: string;
    render: (user: {
        userId: string;
        fullName: string;
        studentId: string;
        assignedTrack: 'TECHNICAL' | 'LOGISTICS' | null
    }) => ReactNode
}) {
    const [page, setPage] = useState(0);
    const q = useApplications(campaignId, {page, status: 'ACCEPTED', track: ''});
    if (q.isPending) return <LoadingState/>;
    if (q.isError) return <ErrorState message={errorMessage(q.error)}/>;
    return <div className="space-y-3">{!q.data.items.length && <p>Chưa có tình nguyện viên được chấp nhận.</p>}{q.data.items.map(u =>
        <div className="break-words" key={u.userId}>{render(u)}</div>)}<Pagination {...q.data} onPageChange={setPage}/>
    </div>;
}

export function date(value: string | null) {
    return value ? new Date(value).toLocaleString('vi-VN') : 'Chưa thiết lập';
}

export function local(value: string | null) {
    if (!value) return '';
    const d = new Date(value);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function instant(value: string) {
    return new Date(value).toISOString();
}
