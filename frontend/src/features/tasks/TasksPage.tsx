import type {TaskInput} from '../coordination/types';
import {useState} from 'react';
import {useParams, Link} from 'react-router-dom';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useCampaign} from '../campaigns/hooks';
import {useAuth} from '../auth/store';
import {useCoordinationQuery, useCoordinationMutation} from '../coordination/hooks';
import {Field, WorkspaceLinks, Roster, date, local, instant} from '../coordination/components';
import {taskStatuses, tracks, priorities} from '../coordination/types';
import {errorMessage, apiError} from '../../shared/api/errors';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {Input} from '../../shared/components/Input';
import {Textarea} from '../../shared/components/Textarea';
import {Select} from '../../shared/components/Select';
import {Badge} from '../../shared/components/Badge';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {Pagination} from '../../shared/components/Pagination';
import {ErrorState} from '../../shared/components/ErrorState';
import {LoadingState} from '../../shared/components/LoadingState';
import {EmptyState} from '../../shared/components/EmptyState';
import type {Task, Track} from '../coordination/types';
import * as api from './api';

export function TasksPage({mine = false, detail = false}: { mine?: boolean; detail?: boolean }) {
    const {campaignId = '', taskId = ''} = useParams();
    return <Tasks key={campaignId + taskId + mine} c={campaignId} id={detail ? taskId : ''} mine={mine}/>;
}

function Tasks({c, id, mine}: { c: string; id: string; mine: boolean }) {
    const [page, setPage] = useState(0);
    const [status, setStatus] = useState('');
    const [edit, setEdit] = useState<Task | true | null>(null);
    const [action, setAction] = useState<{ task: Task; command: string } | null>(null);
    const [feedback, setFeedback] = useState('');
    const q = useCoordinationQuery(['tasks', c, mine, page, status], () => mine ? api.mine(page, status) : api.list(c, page, status), !id);
    const detail = useCoordinationQuery(['task', id], () => api.detail(id), !!id);
    const campaign = useCampaign(c || detail.data?.campaignId || '');
    const user = useAuth(s => s.user);
    const manager = !!campaign.data && (!!campaign.data.ownRole || user?.role === 'ADMIN');
    const mutable = manager && ['OPEN', 'ACTIVE'].includes(campaign.data.status);
    const mutation = useCoordinationMutation(async (a: { task: Task; command: string }) => {
        if (a.command === 'delete') return api.remove(a.task.id, a.task.version);
        if (a.command === 'TODO' || a.command === 'IN_PROGRESS') return api.save(a.task.campaignId, a.task.id, {
            status: a.command,
            version: a.task.version
        });
        return api.transition(a.task.id, a.command, a.task.version);
    });
    const data = id ? detail.data ? [detail.data] : [] : q.data?.items || [];
    const pending = id ? detail.isPending : q.isPending;
    const error = id ? detail.error : q.error;
    return <div className="space-y-6"><h1
        className="text-3xl font-semibold">{mine ? 'Nhiệm vụ của tôi' : id ? 'Chi tiết nhiệm vụ' : 'Nhiệm vụ chiến dịch'}</h1>{!mine && manager && (c || detail.data) &&
        <WorkspaceLinks id={c || detail.data!.campaignId}/>}{!id &&
        <Field label="Trạng thái"><Select value={status} onChange={e => {
            setStatus(e.target.value);
            setPage(0);
        }}>
            <option value="">Tất cả trạng thái</option>
            {Object.entries(taskStatuses).map(([v, l]) => <option value={v} key={v}>{l}</option>)}
        </Select></Field>}{id && !manager &&
        <div className="flex flex-wrap gap-4"><Link className="text-primary hover:underline" to="/me/tasks">Nhiệm vụ của tôi</Link>{detail.data &&
            <Link className="text-primary hover:underline" to={'/me/campaigns/' + detail.data.campaignId + '/meetings'}>Lịch họp chiến dịch</Link>}</div>}{!mine && !id && mutable &&
        <Button onClick={() => setEdit(true)}>Tạo nhiệm vụ</Button>}{feedback &&
        <p role="status" className="text-success">{feedback}</p>}{mutation.isError &&
        <ErrorState message={errorMessage(mutation.error)}/>} {pending ? <LoadingState/> : error ?
        <ErrorState message={errorMessage(error)}/> : !data.length ?
            <EmptyState message="Chưa có nhiệm vụ phù hợp."/> : data.map(t => <Card key={t.id}>
                <div className="flex flex-wrap justify-between gap-3"><h2 className="break-words text-xl font-semibold">
                    <Link className="text-primary hover:underline" to={'/tasks/' + t.id}>{t.title}</Link></h2><Badge
                    tone={t.status === 'VERIFIED' ? 'success' : 'neutral'}>{taskStatuses[t.status]}</Badge></div>
                <p>{t.campaignTitle} · {tracks[t.track]} · {priorities[t.priority]} mức ưu tiên</p><p
                className="mt-3 whitespace-pre-wrap break-words">{t.description}</p><p>Hạn hoàn thành: {date(t.dueAt)}</p><p
                className="break-words">Người được phân công: {t.assignees.map(a => a.fullName + ' (' + a.studentId + ', ' + tracks[a.assignedTrack] + ')').join('; ') || 'Chưa phân công'}</p>{t.verifiedAt &&
                <p>Xác minh: {date(t.verifiedAt)}</p>}
                <div className="mt-4 flex flex-wrap gap-3">{t.canProgress && t.status === 'TODO' &&
                    <Button disabled={mutation.isPending} onClick={() => setAction({
                        task: t,
                        command: 'start'
                    })}>Bắt đầu</Button>}{t.canProgress && t.status === 'IN_PROGRESS' &&
                    <Button disabled={mutation.isPending} onClick={() => setAction({task: t, command: 'done'})}>Đánh dấu đã làm xong</Button>}{t.canManage && <><Button disabled={mutation.isPending}
                                                                onClick={() => setEdit(t)}>Chỉnh sửa nhiệm vụ</Button>{t.status === 'DONE' &&
                    <Button disabled={mutation.isPending} onClick={() => setAction({task: t, command: 'verify'})}>Xác minh nhiệm vụ</Button>}{t.status === 'IN_PROGRESS' &&
                    <Button disabled={mutation.isPending} onClick={() => setAction({task: t, command: 'TODO'})}>Chuyển lại cần làm</Button>}{t.status === 'DONE' &&
                    <Button disabled={mutation.isPending} onClick={() => setAction({task: t, command: 'IN_PROGRESS'})}>Chuyển lại đang thực hiện</Button>}<Button disabled={mutation.isPending} onClick={() => setAction({
                    task: t,
                    command: 'delete'
                })}>Xóa</Button></>}</div>
            </Card>)}{!id && q.data && <Pagination {...q.data} onPageChange={setPage}/>} {edit &&
        <Card><TaskForm key={edit === true ? 'new' : edit.id} c={edit === true ? c : edit.campaignId}
                        value={edit === true ? undefined : edit} onClose={() => setEdit(null)} onSaved={() => {
            setFeedback('Đã lưu nhiệm vụ.');
            setEdit(null);
        }}/></Card>}<ConfirmDialog open={!!action} title="Xác nhận thay đổi nhiệm vụ?"
                                   message={action?.command === 'verify' ? 'Xác minh là quyết định cuối cùng. Nhiệm vụ sẽ chỉ được xem.' : action?.command === 'delete' ? 'Nhiệm vụ và các phân công sẽ bị xóa.' : 'Xác nhận đổi trạng thái nhiệm vụ.'}
                                   confirmLabel="Xác nhận" busy={mutation.isPending} onClose={() => setAction(null)}
                                   onConfirm={() => {
                                       if (action) mutation.mutate(action, {
                                           onSuccess: () => {
                                               setAction(null);
                                               setFeedback('Đã cập nhật nhiệm vụ.');
                                           },
                                           onError: () => setAction(null)
                                       });
                                   }}/></div>;
}

interface Values {
    title: string;
    description: string;
    track: Track;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueAt: string;
    assigneeUserIds: string[]
}

function TaskForm({c, value, onClose, onSaved}: { c: string; value?: Task; onClose: () => void; onSaved: () => void }) {
    const f = useForm<Values>({
        defaultValues: {
            title: value?.title || '',
            description: value?.description || '',
            track: value?.track || 'TECHNICAL',
            priority: value?.priority || 'MEDIUM',
            dueAt: local(value?.dueAt || null),
            assigneeUserIds: value?.assignees.map(a => a.userId) || []
        }
    });
    const [selected, setSelected] = useState(value?.assignees.map(a => a.userId) || []);
    const [selectedTracks, setSelectedTracks] = useState<Record<string, Track>>(Object.fromEntries(value?.assignees.map(a => [a.userId, a.assignedTrack]) || []));
    const warning = selected.some(id => selectedTracks[id] !== f.watch('track'));
    const [confirmation, setConfirmation] = useState<Values | null>(null);
    const m = useCoordinationMutation((body: TaskInput) => api.save(c, value?.id, body));
    const save = (v: Values) => m.mutate({
        ...v,
        assigneeUserIds: selected,
        dueAt: v.dueAt ? value && v.dueAt === local(value.dueAt) ? value.dueAt : instant(v.dueAt) : null,
        clearFields: value && !v.dueAt ? ['dueAt'] : [],
        version: value?.version
    }, {
        onSuccess: onSaved, onError: e => {
            setConfirmation(null);
            for (const field of apiError(e)?.fieldErrors || []) f.setError(field.field as keyof Values, {message: field.message});
        }
    });
    const submit = f.handleSubmit(v => {
        const parsed = z.object({
            title: z.string().trim().min(1).max(200),
            description: z.string().trim().min(1).max(10000),
            track: z.enum(['TECHNICAL', 'LOGISTICS']),
            priority: z.enum(['LOW', 'MEDIUM', 'HIGH'])
        }).safeParse(v);
        if (!parsed.success) {
            for (const e of parsed.error.issues) f.setError(e.path[0] as keyof Values, {message: e.message});
            return;
        }
        setConfirmation(v);
    });
    return <form noValidate onSubmit={submit} className="space-y-4"><h2
        className="text-xl font-semibold">{value ? 'Chỉnh sửa nhiệm vụ' : 'Tạo nhiệm vụ'}</h2><Field label="Tiêu đề"
                                                                                           error={f.formState.errors.title?.message}><Input
        autoFocus maxLength={200} {...f.register('title')}/></Field><Field label="Mô tả"
                                                                           error={f.formState.errors.description?.message}><Textarea
        maxLength={10000} {...f.register('description')}/></Field><Field
        label="Nhóm đóng góp"><Select {...f.register('track')}>{Object.entries(tracks).map(([v, l]) => <option
        key={v} value={v}>{l}</option>)}</Select></Field><Field
        label="Mức ưu tiên"><Select {...f.register('priority')}>{Object.entries(priorities).map(([v, l]) => <option key={v}
                                                                                                                 value={v}>{l}</option>)}</Select></Field><Field
        label="Hạn hoàn thành"><Input type="datetime-local" {...f.register('dueAt')}/></Field>
        <fieldset className="space-y-3">
            <legend className="font-medium">Tình nguyện viên được phân công ({selected.length} selected)</legend>
            <p className="text-text-secondary">Có thể phân công khác nhóm đóng góp. Kiểm tra nhóm của từng tình nguyện viên trước khi xác nhận.</p><Roster campaignId={c} render={u => <label className="flex gap-3"><input type="checkbox"
                                                                                                        checked={selected.includes(u.userId)}
                                                                                                        onChange={e => {
                                                                                                            setSelected(ids => e.target.checked ? [...ids, u.userId] : ids.filter(id => id !== u.userId));
                                                                                                            if (u.assignedTrack) setSelectedTracks(old => ({
                                                                                                                ...old,
                                                                                                                [u.userId]: u.assignedTrack!
                                                                                                            }));
                                                                                                        }}/><span>{u.fullName} · {u.studentId} · {u.assignedTrack ? tracks[u.assignedTrack] : ''}</span></label>}/>
        </fieldset>
        {m.isError && <ErrorState message={errorMessage(m.error)}/>}
        <div className="flex gap-3"><Button type="submit" disabled={m.isPending}>Lưu nhiệm vụ</Button><Button
            disabled={m.isPending} onClick={onClose}>Đóng</Button></div>
        <ConfirmDialog open={!!confirmation} title="Lưu nhiệm vụ và phân công?"
                       message={(warning ? 'Có người được phân công khác nhóm đóng góp. ' : '') + 'Xác nhận nhóm và tình nguyện viên được chọn; có thể phân công khác nhóm đóng góp.'}
                       busy={m.isPending} confirmLabel="Lưu" onClose={() => setConfirmation(null)} onConfirm={() => {
            if (confirmation) save(confirmation);
        }}/></form>;
}
