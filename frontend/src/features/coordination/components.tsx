import {useLanguage, tr, renderText, locale} from "../../shared/lib/i18n";
import {Link} from 'react-router-dom';
import type {ReactNode} from 'react';
import {useState} from 'react';
import {useApplications} from '../volunteers/hooks';
import {Pagination} from '../../shared/components/Pagination';
import {ErrorState} from '../../shared/components/ErrorState';
import {LoadingState} from '../../shared/components/LoadingState';
import {errorMessage} from '../../shared/api/errors';

export function WorkspaceLinks({id}: { id: string }) {
    useLanguage();
    return <nav
        className="flex flex-wrap gap-4">{renderText([['', tr("Không gian làm việc")], ['/team', tr("Đội tình nguyện")], ['/meetings', tr("Lịch họp")], ['/tasks', tr("Nhiệm vụ")], ['/attendance', tr("Điểm danh")], ['/completions', tr("Hoàn thành")], ['/finance', tr("Tài chính")]].map(([suffix, label]) =>
        <Link className="text-primary hover:underline" key={suffix}
              to={'/manage/campaigns/' + id + suffix}>{renderText(label)}</Link>))}</nav>;
}

export function Field({label, error, children}: { label: string; error?: string; children: ReactNode }) {
    useLanguage();
    return <label className="block space-y-2"><span className="block font-medium">{renderText(label)}</span>{renderText(children)}{renderText(error &&
        <span role="alert" className="block text-danger">{renderText(error)}</span>)}</label>;
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
    useLanguage();
    const [page, setPage] = useState(0);
    const q = useApplications(campaignId, {page, status: 'ACCEPTED', track: ''});
    if (q.isPending) return <LoadingState/>;
    if (q.isError) return <ErrorState message={errorMessage(q.error)}/>;
    return <div className="space-y-3">{renderText(!q.data.items.length && <p>{tr("Chưa có tình nguyện viên được chấp nhận.")}</p>)}{renderText(q.data.items.map(u =>
        <div className="break-words" key={u.userId}>{renderText(render(u))}</div>))}<Pagination {...q.data} onPageChange={setPage}/>
    </div>;
}

export function date(value: string | null) {
    return value ? new Date(value).toLocaleString(locale()) : tr("Chưa thiết lập");
}

export function local(value: string | null) {
    if (!value) return '';
    const d = new Date(value);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function instant(value: string) {
    return new Date(value).toISOString();
}
