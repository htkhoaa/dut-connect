import type {MeetingInput} from '../coordination/types';
import {useState} from 'react';
import {useParams} from 'react-router-dom';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useCampaign} from '../campaigns/hooks';
import {useAuth} from '../auth/store';
import {useCoordinationQuery, useCoordinationMutation} from '../coordination/hooks';
import {Field, WorkspaceLinks, date, local, instant} from '../coordination/components';
import {meetingTypes, type Meeting} from '../coordination/types';
import * as api from './api';
import {errorMessage, apiError} from '../../shared/api/errors';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {Input} from '../../shared/components/Input';
import {Textarea} from '../../shared/components/Textarea';
import {Select} from '../../shared/components/Select';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {Pagination} from '../../shared/components/Pagination';
import {ErrorState} from '../../shared/components/ErrorState';
import {LoadingState} from '../../shared/components/LoadingState';
import {EmptyState} from '../../shared/components/EmptyState';

export function MeetingsPage({student = false}: { student?: boolean }) {
    const {campaignId = ''} = useParams();
    return <Meetings key={campaignId + student} c={campaignId} student={student}/>;
}

function Meetings({c, student}: { c: string; student: boolean }) {
    const [feedback, setFeedback] = useState('');
    const [page, setPage] = useState(0);
    const [edit, setEdit] = useState<Meeting | true | null>(null);
    const [remove, setRemove] = useState<Meeting | null>(null);
    const q = useCoordinationQuery(['meetings', c, page], () => api.list(c, page));
    const campaign = useCampaign(c);
    const user = useAuth(s => s.user);
    const mutation = useCoordinationMutation((v: Meeting) => api.remove(v.id, v.version));
    const manager = !!campaign.data && (!!campaign.data.ownRole || user?.role === 'ADMIN');
    const mutable = manager && ['OPEN', 'ACTIVE'].includes(campaign.data?.status || '');
    return <div className="space-y-6"><h1 className="text-3xl font-semibold">Lịch họp</h1>{!student && manager &&
        <WorkspaceLinks id={c}/>}<p>{campaign.data?.content.title}</p>{mutable &&
        <Button onClick={() => setEdit(true)}>Tạo lịch họp</Button>}{feedback &&
        <p role="status" className="text-success">{feedback}</p>}{q.isPending ? <LoadingState/> : q.isError ?
        <ErrorState message={errorMessage(q.error)}/> : <>{!q.data.items.length &&
            <EmptyState message="Chưa có lịch họp."/>}{q.data.items.map(v => <Card key={v.id}><h2
            className="break-words text-xl font-semibold">{v.title}</h2>
            <p>{meetingTypes[v.meetingType]} · {date(v.startsAt)} – {date(v.endsAt)}</p><p
                className="whitespace-pre-wrap break-words">{v.description}</p>{v.location &&
                <p className="break-words">Địa điểm: {v.location}</p>}{v.meetingUrl &&
                <a className="break-all text-primary hover:underline" href={v.meetingUrl} target="_blank" rel="noreferrer">Tham gia cuộc họp</a>}{mutable &&
                <div className="mt-4 flex gap-3"><Button onClick={() => setEdit(v)}>Chỉnh sửa</Button><Button
                    onClick={() => setRemove(v)}>Xóa</Button></div>}</Card>)}<Pagination {...q.data}
                                                                                            onPageChange={setPage}/></>}{edit &&
        <Card><MeetingForm key={edit === true ? 'new' : edit.id} c={c} value={edit === true ? undefined : edit}
                           onClose={() => setEdit(null)} onSaved={() => {
            setFeedback('Đã lưu lịch họp.');
            setEdit(null);
        }}/></Card>}{mutation.isError && <ErrorState message={errorMessage(mutation.error)}/>}<ConfirmDialog
        open={!!remove} title="Xóa lịch họp?" message="Lịch họp này sẽ bị xóa." confirmLabel="Xóa"
        busy={mutation.isPending} onClose={() => setRemove(null)} onConfirm={() => {
        if (remove) mutation.mutate(remove, {
            onSuccess: () => {
                setRemove(null);
                setFeedback('Đã xóa lịch họp.');
            },
            onError: () => setRemove(null)
        });
    }}/></div>;
}

interface Values {
    title: string;
    description: string;
    meetingType: 'ONLINE' | 'OFFLINE';
    startsAt: string;
    endsAt: string;
    location: string;
    meetingUrl: string
}

function MeetingForm({c, value, onClose, onSaved}: {
    c: string;
    value?: Meeting;
    onClose: () => void;
    onSaved: () => void
}) {
    const f = useForm<Values>({
        defaultValues: {
            title: value?.title || '',
            description: value?.description || '',
            meetingType: value?.meetingType || 'OFFLINE',
            startsAt: local(value?.startsAt || null),
            endsAt: local(value?.endsAt || null),
            location: value?.location || '',
            meetingUrl: value?.meetingUrl || ''
        }
    });
    const m = useCoordinationMutation((body: MeetingInput) => api.save(c, value?.id, body));
    const type = f.watch('meetingType');
    const submit = f.handleSubmit(v => {
        const parsed = z.object({
            title: z.string().trim().min(1).max(200),
            description: z.string().max(10000),
            startsAt: z.string().min(1),
            endsAt: z.string().min(1),
            location: z.string().max(300),
            meetingUrl: z.string().max(1000)
        }).safeParse(v);
        if (!parsed.success) {
            for (const e of parsed.error.issues) f.setError(e.path[0] as keyof Values, {message: e.message});
            return;
        }
        if (new Date(v.endsAt) <= new Date(v.startsAt)) {
            f.setError('endsAt', {message: 'Thời điểm kết thúc phải sau bắt đầu'});
            return;
        }
        if ((type === 'ONLINE' || v.meetingUrl.trim()) && !z.url({protocol: /^https?$/}).safeParse(v.meetingUrl.trim()).success) {
            f.setError('meetingUrl', {message: 'Nhập địa chỉ HTTP(S) đầy đủ'});
            return;
        }
        if (type === 'OFFLINE' && !v.location.trim()) {
            f.setError('location', {message: 'Nhập địa điểm'});
            return;
        }
        m.mutate({
            ...v,
            startsAt: value && v.startsAt === local(value.startsAt) ? value.startsAt : instant(v.startsAt),
            endsAt: value && v.endsAt === local(value.endsAt) ? value.endsAt : instant(v.endsAt),
            description: v.description || null,
            location: v.location || null,
            meetingUrl: v.meetingUrl || null,
            clearFields: value ? ['description', 'location', 'meetingUrl'].filter(k => !v[k as keyof Values]) : [],
            version: value?.version
        }, {
            onSuccess: onSaved, onError: e => {
                for (const field of apiError(e)?.fieldErrors || []) f.setError(field.field as keyof Values, {message: field.message});
            }
        });
    });
    return <form noValidate onSubmit={submit} className="space-y-4"><h2
        className="text-xl font-semibold">{value ? 'Chỉnh sửa lịch họp' : 'Tạo lịch họp'}</h2><Field label="Tiêu đề"
                                                                                                 error={f.formState.errors.title?.message}><Input
        autoFocus maxLength={200} {...f.register('title')}/></Field><Field label="Mô tả"
                                                                           error={f.formState.errors.description?.message}><Textarea
        maxLength={10000} {...f.register('description')}/></Field><Field
        label="Hình thức họp"><Select {...f.register('meetingType')}>
        {Object.entries(meetingTypes).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
    </Select></Field>{(['startsAt', 'endsAt'] as const).map(k => <Field key={k}
                                                                        label={k === 'startsAt' ? 'Bắt đầu' : 'Kết thúc'}
                                                                        error={f.formState.errors[k]?.message}><Input
        type="datetime-local" {...f.register(k)}/></Field>)}<Field label="Địa điểm"
                                                                   error={f.formState.errors.location?.message}><Input
        maxLength={300} {...f.register('location')}/></Field><Field label="Liên kết cuộc họp"
                                                                    error={f.formState.errors.meetingUrl?.message}><Input
        maxLength={1000} {...f.register('meetingUrl')}/></Field>{m.isError &&
        <ErrorState message={errorMessage(m.error)}/>}
        <div className="flex gap-3"><Button type="submit" disabled={m.isPending}>Lưu lịch họp</Button><Button
            disabled={m.isPending} onClick={onClose}>Đóng</Button></div>
    </form>;
}
