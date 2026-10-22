import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import type {CompletionInput} from '../coordination/types';
import {useState} from 'react';
import {useParams} from 'react-router-dom';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {useCampaign} from '../campaigns/hooks';
import {useAuth} from '../auth/store';
import {useCoordinationQuery, useCoordinationMutation} from '../coordination/hooks';
import {Field, WorkspaceLinks, date} from '../coordination/components';
import {completionStatuses, tracks} from '../coordination/types';
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
import type {Completion, CompletionStatus} from '../coordination/types';
import * as api from './completionApi';

export function CompletionPage() {
    useLanguage();
    const {campaignId = ''} = useParams();
    return <Completions key={campaignId} c={campaignId}/>;
}

function Completions({c}: { c: string }) {
    useLanguage();
    const [page, setPage] = useState(0);
    const [edit, setEdit] = useState<Completion | null>(null);
    const [feedback, setFeedback] = useState('');
    const q = useCoordinationQuery(['completions', c, page], () => api.completions(c, page));
    const campaign = useCampaign(c);
    const user = useAuth(s => s.user);
    const manager = !!campaign.data && (!!campaign.data.ownRole || user?.role === 'ADMIN');
    const mutable = manager && q.isSuccess && ['OPEN', 'ACTIVE', 'COMPLETED'].includes(campaign.data?.status || '');
    return <div className="space-y-6"><h1 className="text-3xl font-semibold">{tr("Hoàn thành tình nguyện")}</h1>{renderText(manager && <WorkspaceLinks
        id={c}/>)}<p>{tr("Điểm danh và hoàn thành là hai thông tin riêng. Số giờ chính thức cần được người quản lý xác minh.")}</p>{renderText(feedback &&
        <p role="status" className="text-success">{renderText(feedback)}</p>)}{renderText(q.isPending ? <LoadingState/> : q.isError ?
        <ErrorState message={errorMessage(q.error)}/> : <>{!q.data.items.length &&
            <EmptyState message={tr("Chưa có tình nguyện viên được chấp nhận.")}/>}{q.data.items.map(v => <Card key={v.userId}>
            <div className="flex flex-wrap justify-between gap-3"><h2
                className="break-words text-xl font-semibold">{renderText(v.fullName)}</h2><Badge
                tone={v.status === 'VERIFIED' ? 'success' : 'neutral'}>{renderText(completionStatuses[v.status])}</Badge></div>
            <p className="break-words">{renderText(v.studentId)} · {renderText(tracks[v.assignedTrack])}</p><p>{tr("Buổi có mặt:")}{renderText(v.presentSessions)} / {renderText(v.totalSessions)}</p>
            <p>{renderText(v.status === 'VERIFIED' ? tr("Đã xác minh") : tr("Đã ghi nhận"))}{tr("giờ:")}{renderText(v.verifiedHours ?? tr("Chưa ghi nhận"))}</p><p
            className="whitespace-pre-wrap break-words">{renderText(v.note)}</p>{renderText(v.verifiedAt &&
            <p>{tr("Đã xác minh")}{renderText(date(v.verifiedAt))}</p>)}{renderText(mutable && v.status !== 'VERIFIED' &&
            <Button onClick={() => setEdit(v)}>{tr("Ghi nhận hoàn thành")}</Button>)}</Card>)}<Pagination {...q.data}
                                                                                               onPageChange={setPage}/></>)}{renderText(edit &&
        <Card><CompletionForm key={edit.userId} c={c} value={edit} onClose={() => setEdit(null)} onSaved={() => {
            setEdit(null);
            setFeedback(tr("Đã lưu kết quả hoàn thành."));
        }}/></Card>)}</div>;
}

function CompletionForm({c, value, onClose, onSaved}: {
    c: string;
    value: Completion;
    onClose: () => void;
    onSaved: () => void
}) {
    useLanguage();
    const f = useForm<{
        status: CompletionStatus;
        verifiedHours: string;
        note: string
    }>({
        defaultValues: {
            status: value.status === 'PENDING' ? 'COMPLETED' : value.status,
            verifiedHours: value.verifiedHours || '',
            note: value.note || ''
        }
    });
    const [confirm, setConfirm] = useState<{
        status: CompletionStatus;
        verifiedHours: string | null;
        note: string;
        version: number | null
    } | null>(null);
    const m = useCoordinationMutation((body: CompletionInput) => api.saveCompletion(c, value.userId, body));
    return <form noValidate className="space-y-4" onSubmit={f.handleSubmit(v => {
        const hours = z.string().regex(/^[0-9]{1,6}([.][0-9]{1,2})?$/, tr("Nhập từ 0 đến 999999,99 với tối đa hai chữ số thập phân"));
        if (v.status === 'VERIFIED' && !v.verifiedHours) {
            f.setError('verifiedHours', {message: tr("Vui lòng nhập số giờ để xác minh")});
            return;
        }
        if (v.verifiedHours && !hours.safeParse(v.verifiedHours).success) {
            f.setError('verifiedHours', {message: tr("Nhập từ 0 đến 999999,99 với tối đa hai chữ số thập phân")});
            return;
        }
        const p = z.string().max(1000).safeParse(v.note);
        if (!p.success) {
            f.setError('note', {message: p.error.issues[0].message});
            return;
        }
        setConfirm({...v, verifiedHours: v.verifiedHours || null, version: value.version});
    })}><h2 className="text-xl font-semibold">{tr("Hoàn thành của")}{renderText(value.fullName)}</h2><Field
        label={tr("Trạng thái hoàn thành")}><Select
        autoFocus {...f.register('status')}>{renderText(Object.entries(completionStatuses).filter(([s]) => value.status !== 'COMPLETED' || s !== 'PENDING').map(([s, l]) =>
        <option key={s} value={s}>{renderText(l)}</option>))}</Select></Field><Field label={tr("Số giờ")}
                                                                        error={f.formState.errors.verifiedHours?.message}><Input
        inputMode="decimal" {...f.register('verifiedHours')}/></Field><Field label={tr("Ghi chú")}
                                                                             error={f.formState.errors.note?.message}><Textarea
        maxLength={1000} {...f.register('note')}/></Field>{renderText(m.isError && <ErrorState message={errorMessage(m.error)}/>)}
        <div className="flex gap-3"><Button type="submit" disabled={m.isPending}>{tr("Lưu hoàn thành")}</Button><Button
            disabled={m.isPending} onClick={onClose}>{tr("Đóng")}</Button></div>
        <ConfirmDialog open={!!confirm}
                       title={confirm?.status === 'VERIFIED' ? tr("Xác minh hoàn thành chính thức?") : tr("Lưu kết quả hoàn thành?")}
                       message={confirm?.status === 'VERIFIED' ? tr("Ghi nhận số giờ chính thức và là quyết định cuối cùng. Điểm danh không tự xác minh hoàn thành.") : tr("Ghi nhận hoàn thành, chưa xác minh kết quả chính thức.")}
                       busy={m.isPending} confirmLabel={tr("Xác nhận")} onClose={() => setConfirm(null)} onConfirm={() => {
            if (confirm) m.mutate(confirm, {
                onSuccess: onSaved, onError: e => {
                    setConfirm(null);
                    for (const field of apiError(e)?.fieldErrors || []) f.setError(field.field as 'verifiedHours' | 'note' | 'status', {message: field.message});
                }
            });
        }}/></form>;
}
