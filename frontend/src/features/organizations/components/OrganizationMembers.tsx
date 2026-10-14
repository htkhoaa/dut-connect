import {useLanguage, tr, renderText, locale} from "../../../shared/lib/i18n";
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
    useLanguage();
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
        try {await add.mutateAsync({...parsed.data, version: detail.organization.version}); form.reset(); setFeedback(tr("Đã thêm thành viên."));}
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
            setFeedback(action.command === 'transfer' ? tr("Đã chuyển quyền sở hữu. Vai trò của bạn hiện là người quản lý.") : tr("Đã cập nhật thành viên."));
        } catch (error) {setFailure(errorMessage(error));}
        finally {setAction(null);}
    }
    return <section className="space-y-5" aria-labelledby="organization-members-title">
        <h2 id="organization-members-title" className="text-xl font-semibold">{tr("Thành viên")}</h2>
        {renderText(detail.canManageMembers && <form noValidate onSubmit={submit} className="space-y-4 rounded-xl border border-border p-4">
            <p className="text-sm text-text-secondary">{tr("Thêm sinh viên đã đăng ký bằng mã sinh viên chính xác.")}</p>
            <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
                <FormField id="member-student-id" label={tr("Mã sinh viên")} error={form.formState.errors.studentId?.message}><Input id="member-student-id" maxLength={32} {...form.register('studentId')}/></FormField>
                <FormField id="member-role" label={tr("Vai trò")} error={form.formState.errors.memberRole?.message}><Select id="member-role" {...form.register('memberRole')}><option value="MEMBER">{tr("Thành viên")}</option><option value="MANAGER">{tr("Người quản lý")}</option></Select></FormField>
            </fieldset>
            <Button type="submit" disabled={pending}>{renderText(add.isPending ? tr("Đang thêm…") : tr("Thêm thành viên"))}</Button>
        </form>)}
        {renderText(failure && <ErrorState message={failure}/>)}
        {renderText(feedback && <p role="status" className="text-success">{renderText(feedback)}</p>)}
        {renderText(list.isPending ? <LoadingState message={tr("Đang tải thành viên…")}/> : list.isError ? <ErrorState message={errorMessage(list.error)} onRetry={() => void list.refetch()}/> : <>
            {list.data.items.length === 0 ? <EmptyState message={tr("Chưa có thành viên.")}/> : <Table caption={tr("Thành viên tổ chức")}>
                <thead className="bg-surface-muted"><tr>{renderText([tr("Họ tên / Mã sinh viên"), tr("Vai trò"), tr("Ngày tham gia"), ...(detail.canManageMembers ? [tr("Thao tác")] : [])].map(label => <th key={label} scope="col" className="p-4">{renderText(label)}</th>))}</tr></thead>
                <tbody>{renderText(list.data.items.map(member => <tr key={member.userId} className="border-t border-border">
                    <td className="p-4">{renderText(member.fullName)}<br/><span className="text-text-secondary">{renderText(member.studentId)}</span></td>
                    <td className="p-4">{renderText(memberRoles[member.memberRole])}</td>
                    <td className="p-4">{renderText(new Date(member.joinedAt).toLocaleDateString(locale()))}</td>
                    {renderText(detail.canManageMembers && <td className="p-4"><div className="flex min-w-44 flex-wrap gap-2">
                        {renderText(member.memberRole !== 'OWNER' && <>
                            <Button disabled={pending} onClick={() => setAction({member, command: member.memberRole === 'MEMBER' ? 'MANAGER' : 'MEMBER', version: detail.organization.version})}>{renderText(member.memberRole === 'MEMBER' ? tr("Gán vai trò quản lý") : tr("Gán vai trò thành viên"))}</Button>
                            <Button disabled={pending} onClick={() => setAction({member, command: 'transfer', version: detail.organization.version})}>{tr("Chuyển quyền sở hữu")}</Button>
                        </>)}
                        <Button disabled={pending} onClick={() => setAction({member, command: 'remove', version: detail.organization.version})}>{tr("Xóa")}</Button>
                    </div></td>)}
                </tr>))}</tbody>
            </Table>}
            <Pagination page={list.data.page} totalPages={list.data.totalPages} hasNext={list.data.hasNext} hasPrevious={list.data.hasPrevious} onPageChange={setPage}/>
        </>)}
        <ConfirmDialog open={action !== null} title={action?.command === 'transfer' ? 'Chuyển quyền sở hữu?' : action?.command === 'remove' ? tr("Xóa thành viên?") : tr("Đổi vai trò thành viên?")}
                       message={action ? `${action.member.fullName}: ${action.command === 'transfer' ? tr("Người này sẽ trở thành chủ sở hữu, bạn chuyển sang vai trò quản lý.") : action.command === 'remove' ? tr("Người này sẽ không còn là thành viên tổ chức.") : `Vai trò mới: ${memberRoles[action.command]}.`}` : ''}
                       confirmLabel={tr("Xác nhận")} busy={pending} onClose={() => setAction(null)} onConfirm={() => void confirm()}/>
    </section>;
}
