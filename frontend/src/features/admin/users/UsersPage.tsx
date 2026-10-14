import {useLanguage, tr, renderText, locale} from "../../../shared/lib/i18n";
﻿import {useState} from 'react';
import {useUsers, useChangeStatus} from './hooks';
import type {UserSummary} from '../../auth/types';
import {errorMessage} from '../../../shared/api/errors';
import {Button} from '../../../shared/components/Button';
import {Badge} from '../../../shared/components/Badge';
import {accountStatuses} from '../../auth/status';
import {Table} from '../../../shared/components/Table';
import {Pagination} from '../../../shared/components/Pagination';
import {EmptyState} from '../../../shared/components/EmptyState';
import {LoadingState} from '../../../shared/components/LoadingState';
import {ErrorState} from '../../../shared/components/ErrorState';
import {ConfirmDialog} from '../../../shared/components/ConfirmDialog';

export function UsersPage() {
    useLanguage();
    const [page, setPage] = useState(0);
    const [selected, setSelected] = useState<UserSummary | null>(null);
    const users = useUsers(page);
    const change = useChangeStatus();
    if (users.isPending) return <LoadingState message={tr("Đang tải người dùng…")}/>;
    if (users.isError) return <ErrorState message={errorMessage(users.error)} onRetry={() => void users.refetch()}/>;
    return <><h1 className="mb-3 text-3xl font-semibold">{tr("Quản lý người dùng")}</h1>
        <p className="mb-6 text-text-secondary">{renderText(users.data.totalElements)}{tr("tài khoản")}</p>
        {change.isError && <ErrorState message={errorMessage(change.error)}/>}
        {change.isSuccess && <p role="status" className="mb-4 text-success">{tr("Đã cập nhật trạng thái tài khoản.")}</p>}
        <Table caption={tr("Người dùng đã đăng ký và trạng thái tài khoản")}>
            <thead className="bg-surface-muted"><tr>
                {renderText([tr("Họ tên / Mã sinh viên"), 'Email', tr("Vai trò"), tr("Trạng thái"), tr("Ngày tham gia"), tr("Thao tác")].map((label) =>
                    <th key={label} scope="col" className="p-4">{renderText(label)}</th>))}
            </tr></thead>
            <tbody>{renderText(users.data.items.map((user) => <tr key={user.id} className="border-t border-border">
                <td className="p-4"><span className="font-medium">{renderText(user.fullName)}</span><br/>{renderText(user.studentId)}</td>
                <td className="p-4">{renderText(user.email)}</td>
                <td className="p-4">{renderText(user.role === 'ADMIN' ? tr("Quản trị viên") : tr("Sinh viên"))}</td>
                <td className="p-4"><Badge tone={accountStatuses[user.status].tone}>{renderText(accountStatuses[user.status].label)}</Badge></td>
                <td className="p-4">{renderText(new Date(user.createdAt).toLocaleDateString(locale()))}</td>
                <td className="p-4"><Button disabled={change.isPending} onClick={() => setSelected(user)}>
                    {renderText(user.status === 'ACTIVE' ? tr("Tạm ngừng") : tr("Khôi phục"))}
                </Button></td>
            </tr>))}</tbody>
        </Table>
        {users.data.items.length === 0 && <EmptyState message={tr("Không tìm thấy người dùng.")}/>}
        <Pagination page={users.data.page} totalPages={users.data.totalPages} hasPrevious={users.data.hasPrevious}
                    hasNext={users.data.hasNext} onPageChange={setPage}/>
        <ConfirmDialog open={selected !== null} title={selected?.status === 'ACTIVE' ? tr("Tạm ngừng tài khoản?") : tr("Khôi phục tài khoản?")}
                       message={selected ? `${selected.fullName}: ${selected.status === 'ACTIVE' ? tr("Thao tác sẽ khóa quyền truy cập và thu hồi các phiên đăng nhập.") : tr("Tài khoản sẽ có thể đăng nhập trở lại.")}` : ''}
                       confirmLabel={selected?.status === 'ACTIVE' ? tr("Tạm ngừng") : tr("Khôi phục")} busy={change.isPending}
                       onClose={() => setSelected(null)} onConfirm={() => {
                           if (!selected) return;
                           change.mutate({id: selected.id, status: selected.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE', version: selected.version},
                               {onSettled: () => setSelected(null)});
                       }}/>
    </>;
}
