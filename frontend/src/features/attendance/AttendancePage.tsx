import type {SessionInput} from '../coordination/types';
import {useState} from 'react';
import {useParams} from 'react-router-dom';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useCampaign} from '../campaigns/hooks';
import {useAuth} from '../auth/store';
import {useCoordinationQuery, useCoordinationMutation} from '../coordination/hooks';
import {Field, WorkspaceLinks, Roster, date, local, instant} from '../coordination/components';
import {errorMessage, apiError} from '../../shared/api/errors';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {Input} from '../../shared/components/Input';
import {Select} from '../../shared/components/Select';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {Pagination} from '../../shared/components/Pagination';
import {ErrorState} from '../../shared/components/ErrorState';
import {LoadingState} from '../../shared/components/LoadingState';
import {EmptyState} from '../../shared/components/EmptyState';
import {attendanceStatuses, type Session, type AttendanceStatus} from '../coordination/types';
import * as api from './api';

export function AttendancePage() {
    const {campaignId = ''} = useParams();
    return <Attendance key={campaignId} c={campaignId}/>;
}

function Attendance({c}: { c: string }) {
    const [page, setPage] = useState(0);
    const [edit, setEdit] = useState<Session | true | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [remove, setRemove] = useState<Session | null>(null);
    const [feedback, setFeedback] = useState('');
    const q = useCoordinationQuery(['sessions', c, page], () => api.list(c, page));
    const campaign = useCampaign(c);
    const user = useAuth(s => s.user);
    const manager = !!campaign.data && (!!campaign.data.ownRole || user?.role === 'ADMIN');
    const mutable = manager && q.isSuccess && ['OPEN', 'ACTIVE'].includes(campaign.data?.status || '');
    const m = useCoordinationMutation((s: Session) => api.remove(s.id, s.version));
    return <div className="space-y-6"><h1 className="text-3xl font-semibold">Buổi điểm danh</h1>{manager && <WorkspaceLinks
        id={c}/>} {mutable && <Button onClick={() => setEdit(true)}>Tạo buổi điểm danh</Button>}{feedback &&
        <p role="status" className="text-success">{feedback}</p>}{m.isError &&
        <ErrorState message={errorMessage(m.error)}/>} {q.isPending ? <LoadingState/> : q.isError ?
        <ErrorState message={errorMessage(q.error)}/> : <>{!q.data.items.length &&
            <EmptyState message="Chưa có buổi điểm danh."/>}{q.data.items.map(s => <Card key={s.id}><h2
            className="break-words text-xl font-semibold">{s.title}</h2><p>{date(s.startsAt)} – {date(s.endsAt)}</p>
            <div className="mt-4 flex flex-wrap gap-3"><Button onClick={() => setSession(s)}>Xem điểm danh</Button>{mutable && <><Button onClick={() => setEdit(s)}>Chỉnh sửa buổi điểm danh</Button><Button
                onClick={() => setRemove(s)}>Xóa buổi điểm danh</Button></>}</div>
        </Card>)}<Pagination {...q.data} onPageChange={setPage}/></>}{edit &&
        <Card><SessionForm key={edit === true ? 'new' : edit.id} c={c} value={edit === true ? undefined : edit}
                           onClose={() => setEdit(null)} onSaved={() => {
            setEdit(null);
            setFeedback('Đã lưu buổi điểm danh.');
        }}/></Card>}{session &&
        <Card><Records key={session.id + session.version} c={c} session={session} mutable={mutable} onSaved={s => {
            setSession(s);
            setFeedback('Đã lưu điểm danh.');
        }} onClose={() => setSession(null)}/></Card>}<ConfirmDialog open={!!remove} title="Xóa buổi điểm danh?"
                                                                    message="Buổi điểm danh và toàn bộ kết quả điểm danh sẽ bị xóa."
                                                                    confirmLabel="Xóa" busy={m.isPending}
                                                                    onClose={() => setRemove(null)} onConfirm={() => {
        if (remove) m.mutate(remove, {
            onSuccess: () => {
                if (session?.id === remove.id) setSession(null);
                setRemove(null);
                setFeedback('Đã xóa buổi điểm danh.');
            },
            onError: () => setRemove(null)
        });
    }}/></div>;
}

interface Values {
    title: string;
    startsAt: string;
    endsAt: string
}

function SessionForm({c, value, onClose, onSaved}: {
    c: string;
    value?: Session;
    onClose: () => void;
    onSaved: () => void
}) {
    const f = useForm<Values>({
        defaultValues: {
            title: value?.title || '',
            startsAt: local(value?.startsAt || null),
            endsAt: local(value?.endsAt || null)
        }
    });
    const m = useCoordinationMutation((body: SessionInput) => api.save(c, value?.id, body));
    return <form className="space-y-4" noValidate onSubmit={f.handleSubmit(v => {
        const p = z.object({
            title: z.string().trim().min(1).max(200),
            startsAt: z.string().min(1),
            endsAt: z.string().min(1)
        }).safeParse(v);
        if (!p.success) {
            for (const e of p.error.issues) f.setError(e.path[0] as keyof Values, {message: e.message});
            return;
        }
        if (new Date(v.endsAt) <= new Date(v.startsAt)) {
            f.setError('endsAt', {message: 'Thời điểm kết thúc phải sau bắt đầu'});
            return;
        }
        m.mutate({
            ...v,
            startsAt: value && v.startsAt === local(value.startsAt) ? value.startsAt : instant(v.startsAt),
            endsAt: value && v.endsAt === local(value.endsAt) ? value.endsAt : instant(v.endsAt),
            version: value?.version
        }, {
            onSuccess: onSaved, onError: e => {
                for (const field of apiError(e)?.fieldErrors || []) f.setError(field.field as keyof Values, {message: field.message});
            }
        });
    })}><h2 className="text-xl font-semibold">{value ? 'Chỉnh sửa buổi điểm danh' : 'Tạo buổi điểm danh'}</h2><Field label="Tiêu đề"
                                                                                                     error={f.formState.errors.title?.message}><Input
        autoFocus {...f.register('title')} maxLength={200}/></Field>{(['startsAt', 'endsAt'] as const).map(k => <Field
        key={k} label={k === 'startsAt' ? 'Bắt đầu' : 'Kết thúc'} error={f.formState.errors[k]?.message}><Input
        type="datetime-local" {...f.register(k)}/></Field>)}{m.isError && <ErrorState message={errorMessage(m.error)}/>}
        <div className="flex gap-3"><Button type="submit" disabled={m.isPending}>Lưu buổi điểm danh</Button><Button
            disabled={m.isPending} onClick={onClose}>Đóng</Button></div>
    </form>;
}

function Records({c, session, mutable, onSaved, onClose}: {
    c: string;
    session: Session;
    mutable: boolean;
    onSaved: (s: Session) => void;
    onClose: () => void
}) {
    const [page, setPage] = useState(0);
    const [choices, setChoices] = useState<Record<string, AttendanceStatus>>({});
    const [confirm, setConfirm] = useState(false);
    const q = useCoordinationQuery(['records', session.id, page], () => api.records(session.id, page));
    const m = useCoordinationMutation(() => api.record(session.id, session.version, Object.entries(choices).map(([userId, status]) => ({
        userId,
        status
    }))));
    return <div className="space-y-5"><h2 className="break-words text-xl font-semibold">Bản ghi: {session.title}</h2>
        <p>Kết quả đã lưu hiển thị bên dưới. Chưa có bản ghi là chưa ghi nhận, không đồng nghĩa với vắng mặt.</p>{q.isPending ?
            <LoadingState/> : q.isError ? <ErrorState message={errorMessage(q.error)}/> : <>{q.data.items.map(r => <p
                className="break-words"
                key={r.id}>{r.fullName} · {r.studentId}: {attendanceStatuses[r.status]} ·
                Recorded {date(r.recordedAt)}</p>)}{!q.data.items.length &&
                <EmptyState message="Chưa có kết quả điểm danh."/>}<Pagination {...q.data}
                                                                            onPageChange={setPage}/></>}{mutable && <>
            <h3 className="font-semibold">Điểm danh tình nguyện viên đã chấp nhận</h3><p>Lựa chọn không đổi giữ nguyên kết quả hiện có. Tối đa 100 thay đổi mỗi lần lưu.</p><Roster campaignId={c} render={u => <Field
            label={u.fullName + ' · ' + u.studentId}><Select value={choices[u.userId] || ''}
                                                             onChange={e => setChoices(old => {
                                                                 const next = {...old};
                                                                 if (e.target.value) next[u.userId] = e.target.value as AttendanceStatus; else delete next[u.userId];
                                                                 return next;
                                                             })}>
            <option value="">Giữ nguyên</option>
            {Object.entries(attendanceStatuses).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
        </Select></Field>}/><Button
            disabled={m.isPending || !Object.keys(choices).length || Object.keys(choices).length > 100}
            onClick={() => setConfirm(true)}>Lưu điểm danh ({Object.keys(choices).length})</Button></>}{m.isError &&
            <ErrorState message={errorMessage(m.error)}/>}<Button disabled={m.isPending} onClick={onClose}>Đóng danh sách</Button><ConfirmDialog open={confirm} title="Lưu điểm danh?"
                                           message="Chỉ cập nhật tình nguyện viên được chọn. Các bản ghi khác được giữ nguyên."
                                           busy={m.isPending} confirmLabel="Lưu" onClose={() => setConfirm(false)}
                                           onConfirm={() => m.mutate(undefined, {
                                               onSuccess: r => onSaved(r.session),
                                               onError: () => setConfirm(false)
                                           })}/></div>;
}
