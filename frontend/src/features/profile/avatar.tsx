import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {useEffect, useRef, useState} from 'react';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {apiClient} from '../../shared/api/client';
import {useAuth} from '../auth/store';
import type {UserSummary} from '../auth/types';
import type {Profile} from './types';
import {Button} from '../../shared/components/Button';
import {errorMessage} from '../../shared/api/errors';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';

async function getAvatar(): Promise<Blob | null> {
    const response = await apiClient.get<Blob>('/me/avatar', {responseType: 'blob'});
    return response.status === 204 ? null : response.data;
}
export function UserAvatar({className = 'avatar'}: {className?: string}) {
    useLanguage();
    const user = useAuth(s => s.user);
    const avatar = useQuery({queryKey: ['avatar', user?.id], queryFn: getAvatar, enabled: !!user});
    const [url, setUrl] = useState<string>();
    useEffect(() => {
        if (!avatar.data) {setUrl(undefined); return;}
        const value = URL.createObjectURL(avatar.data); setUrl(value);
        return () => URL.revokeObjectURL(value);
    }, [avatar.data]);
    return <span className={className}>{renderText(url ? <img className="avatar-image" src={url} alt={tr("Ảnh đại diện")}/> : user?.fullName.charAt(0).toUpperCase())}</span>;
}
export function AvatarEditor() {
    useLanguage();
    const client = useQueryClient();
    const [file, setFile] = useState<File>();
    const [error, setError] = useState('');
    const [remove, setRemove] = useState(false);
    const input = useRef<HTMLInputElement>(null);
    const user = useAuth(s => s.user);
    const mutation = useMutation({mutationFn: async (remove: boolean) => {
        const current = useAuth.getState().user;
        if (!current) throw Error('Authentication required');
        if (remove) return (await apiClient.delete<UserSummary>('/me/avatar', {params: {version: current.version}})).data;
        const form = new FormData(); form.append('image', file!); form.append('version', String(current.version));
        return (await apiClient.put<UserSummary>('/me/avatar', form)).data;
    }, onError: () => setRemove(false), onSuccess: updated => {
        useAuth.getState().updateUser(updated);
        client.setQueryData<Profile>(['profile'], old => old ? {...old, user: updated} : old);
        void client.invalidateQueries({queryKey: ['avatar', updated.id]}); setFile(undefined); setRemove(false);
        if (input.current) input.current.value = '';
    }});
    return <div className="ui-card mb-6 space-y-3"><h2 className="font-semibold">{tr("Ảnh đại diện")}</h2><p className="text-sm text-text-secondary">{tr("PNG hoặc JPEG, tối đa 1 MB. Ảnh được cắt vuông và lưu cùng tài khoản.")}</p>
        <input ref={input} type="file" accept="image/png,image/jpeg" aria-label={tr("Chọn ảnh đại diện")} disabled={mutation.isPending} onChange={event => {
            const selected = event.target.files?.[0]; setError(''); setFile(undefined);
            if (selected && (!['image/png','image/jpeg'].includes(selected.type) || selected.size > 1048576)) setError(tr("Chọn ảnh PNG hoặc JPEG không quá 1 MB"));
            else setFile(selected);
        }}/><div className="flex flex-wrap gap-3"><Button disabled={!file || mutation.isPending} onClick={() => mutation.mutate(false)}>{tr("Lưu ảnh đại diện")}</Button><Button variant="secondary" disabled={!user || mutation.isPending} onClick={() => setRemove(true)}>{tr("Xóa ảnh đại diện")}</Button></div>
        {renderText((error || mutation.isError) && <p role="alert" className="text-danger">{renderText(error || errorMessage(mutation.error))}</p>)}
        {renderText(mutation.isSuccess && <p role="status" className="text-success">{tr("Đã cập nhật ảnh đại diện.")}</p>)}
        <ConfirmDialog open={remove} title={tr('Xóa ảnh đại diện?')} message={tr('Bạn có thể tải một ảnh mới sau khi xóa.')} confirmLabel={tr('Xóa')} busy={mutation.isPending} onClose={() => setRemove(false)} onConfirm={() => mutation.mutate(true)}/>
    </div>;
}
