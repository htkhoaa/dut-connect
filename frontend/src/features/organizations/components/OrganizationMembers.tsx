import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import type {OrganizationDetail, OrganizationMember, AddMemberRequest} from '../types';
import {memberRoles} from '../presentation';
import {useOrganizationMembers, useAddOrganizationMember, useChangeOrganizationMember, useRemoveOrganizationMember, useTransferOrganization} from '../hooks';
import {apiError, errorMessage} from '../../../shared/api/errors';
import {Button} from '../../../shared/components/Button';
import {Input} from '../../../shared/components/Input';
import {Select} from '../../../shared/components/Select';
import {FormField} from '../../../shared/components/FormField';
import {Table} from '../../../shared/components/Table';
import {Pagination} from '../../../shared/components/Pagination';
import {LoadingState} from '../../../shared/components/LoadingState';
import {EmptyState} from '../../../shared/components/EmptyState';
import {ErrorState} from '../../../shared/components/ErrorState';
import {ConfirmDialog} from '../../../shared/components/ConfirmDialog';

type MemberAction = {member: OrganizationMember; command: 'remove' | 'transfer' | 'MANAGER' | 'MEMBER'; version: number};
const schema = z.object({studentId: z.string().trim().min(1, 'Nhập mã sinh viên').max(32), memberRole: z.enum(['MANAGER', 'MEMBER'])});

export function OrganizationMembers({detail}: {detail: OrganizationDetail}) {
    const id = detail.organization.id;
    const [page, setPage] = useState(0);
    const [action, setAction] = useState<MemberAction | null>(null);
    const [feedback, setFeedback] = useState('');
    const [failure, setFailure] = useState('');
    const list = useOrganizationMembers(id, page);
    const add = useAddOrganizationMember(id);
    const change = useChangeOrganizationMember(id);
    const remove = useRemoveOrganizationMember(id);
    const transfer = useTransferOrganization(id);
    const form = useForm<Omit<AddMemberRequest, 'version'>>({defaultValues: {studentId: '', memberRole: 'MEMBER'}});
    const pending = add.isPending || change.isPending || remove.isPending || transfer.isPending;
    const submit = form.handleSubmit(async input => {
        const parsed = schema.safeParse(input);
        if (!parsed.success) {
            for (const issue of parsed.error.issues) form.setError(issue.path[0] as 'studentId' | 'memberRole', {message: issue.message});
            return;
        }
        setFailure(''); setFeedback('');
        try {await add.mutateAsync({...parsed.data, version: detail.organization.version}); form.reset(); setFeedback('Đã thêm thành viên.');}
        catch (error) {
            setFailure(errorMessage(error));
            for (const field of apiError(error)?.fieldErrors || []) {
                if (field.field === 'studentId' || field.field === 'memberRole')
                    form.setError(field.field, {message: field.message});
            }
        }
    });
    async function confirm() {
        if (!action) return;
        setFailure(''); setFeedback('');
        try {
            const body = {userId: action.member.userId, version: action.version};
            if (action.command === 'remove') await remove.mutateAsync(body);
            else if (action.command === 'transfer') await transfer.mutateAsync(body);
            else await change.mutateAsync({...body, memberRole: action.command});
            setFeedback(action.command === 'transfer' ? 'Đã chuyển quyền sở hữu. Vai trò của bạn hiện là người quản lý.' : 'Đã cập nhật thành viên.');
        } catch (error) {setFailure(errorMessage(error));}
        finally {setAction(null);}
    }
    return <section className="space-y-5" aria-labelledby="organization-members-title">
        <h2 id="organization-members-title" className="text-xl font-semibold">Thành viên</h2>
        {detail.canManageMembers && <form noValidate onSubmit={submit} className="space-y-4 rounded-xl border border-border p-4">
            <p className="text-sm text-text-secondary">Thêm sinh viên đã đăng ký bằng mã sinh viên chính xác.</p>
            <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
                <FormField id="member-student-id" label="Mã sinh viên" error={form.formState.errors.studentId?.message}><Input id="member-student-id" maxLength={32} {...form.register('studentId')}/></FormField>
                <FormField id="member-role" label="Vai trò" error={form.formState.errors.memberRole?.message}><Select id="member-role" {...form.register('memberRole')}><option value="MEMBER">Thành viên</option><option value="MANAGER">Người quản lý</option></Select></FormField>
            </fieldset>
            <Button type="submit" disabled={pending}>{add.isPending ? 'Đang thêm…' : 'Thêm thành viên'}</Button>
        </form>}
        {failure && <ErrorState message={failure}/>}
        {feedback && <p role="status" className="text-success">{feedback}</p>}
        {list.isPending ? <LoadingState message="Đang tải thành viên…"/> : list.isError ? <ErrorState message={errorMessage(list.error)} onRetry={() => void list.refetch()}/> : <>
            {list.data.items.length === 0 ? <EmptyState message="Chưa có thành viên."/> : <Table caption="Thành viên tổ chức">
                <thead className="bg-surface-muted"><tr>{['Họ tên / Mã sinh viên', 'Vai trò', 'Ngày tham gia', ...(detail.canManageMembers ? ['Thao tác'] : [])].map(label => <th key={label} scope="col" className="p-4">{label}</th>)}</tr></thead>
                <tbody>{list.data.items.map(member => <tr key={member.userId} className="border-t border-border">
                    <td className="p-4">{member.fullName}<br/><span className="text-text-secondary">{member.studentId}</span></td>
                    <td className="p-4">{memberRoles[member.memberRole]}</td>
                    <td className="p-4">{new Date(member.joinedAt).toLocaleDateString('vi-VN')}</td>
                    {detail.canManageMembers && <td className="p-4"><div className="flex min-w-44 flex-wrap gap-2">
                        {member.memberRole !== 'OWNER' && <>
                            <Button disabled={pending} onClick={() => setAction({member, command: member.memberRole === 'MEMBER' ? 'MANAGER' : 'MEMBER', version: detail.organization.version})}>{member.memberRole === 'MEMBER' ? 'Gán vai trò quản lý' : 'Gán vai trò thành viên'}</Button>
                            <Button disabled={pending} onClick={() => setAction({member, command: 'transfer', version: detail.organization.version})}>Chuyển quyền sở hữu</Button>
                        </>}
                        <Button disabled={pending} onClick={() => setAction({member, command: 'remove', version: detail.organization.version})}>Xóa</Button>
                    </div></td>}
                </tr>)}</tbody>
            </Table>}
            <Pagination page={list.data.page} totalPages={list.data.totalPages} hasNext={list.data.hasNext} hasPrevious={list.data.hasPrevious} onPageChange={setPage}/>
        </>}
        <ConfirmDialog open={action !== null} title={action?.command === 'transfer' ? 'Chuyển quyền sở hữu?' : action?.command === 'remove' ? 'Xóa thành viên?' : 'Đổi vai trò thành viên?'}
                       message={action ? `${action.member.fullName}: ${action.command === 'transfer' ? 'Người này sẽ trở thành chủ sở hữu, bạn chuyển sang vai trò quản lý.' : action.command === 'remove' ? 'Người này sẽ không còn là thành viên tổ chức.' : `Vai trò mới: ${memberRoles[action.command]}.`}` : ''}
                       confirmLabel="Xác nhận" busy={pending} onClose={() => setAction(null)} onConfirm={() => void confirm()}/>
    </section>;
}
