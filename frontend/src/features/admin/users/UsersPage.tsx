import {useState} from 'react';
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
    const [page, setPage] = useState(0);
    const [selected, setSelected] = useState<UserSummary | null>(null);
    const users = useUsers(page);
    const change = useChangeStatus();
    if (users.isPending) return <LoadingState message="Đang tải người dùng…"/>;
    if (users.isError) return <ErrorState message={errorMessage(users.error)} onRetry={() => void users.refetch()}/>;
    return <><h1 className="mb-3 text-3xl font-semibold">Quản lý người dùng</h1>
        <p className="mb-6 text-text-secondary">{users.data.totalElements} tài khoản</p>
        {change.isError && <ErrorState message={errorMessage(change.error)}/>}
        {change.isSuccess && <p role="status" className="mb-4 text-success">Đã cập nhật trạng thái tài khoản.</p>}
        <Table caption="Người dùng đã đăng ký và trạng thái tài khoản">
            <thead className="bg-surface-muted"><tr>
                {['Họ tên / Mã sinh viên', 'Email', 'Vai trò', 'Trạng thái', 'Ngày tham gia', 'Thao tác'].map((label) =>
                    <th key={label} scope="col" className="p-4">{label}</th>)}
            </tr></thead>
            <tbody>{users.data.items.map((user) => <tr key={user.id} className="border-t border-border">
                <td className="p-4"><span className="font-medium">{user.fullName}</span><br/>{user.studentId}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">{user.role === 'ADMIN' ? 'Quản trị viên' : 'Sinh viên'}</td>
                <td className="p-4"><Badge tone={accountStatuses[user.status].tone}>{accountStatuses[user.status].label}</Badge></td>
                <td className="p-4">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="p-4"><Button disabled={change.isPending} onClick={() => setSelected(user)}>
                    {user.status === 'ACTIVE' ? 'Tạm ngừng' : 'Khôi phục'}
                </Button></td>
            </tr>)}</tbody>
        </Table>
        {users.data.items.length === 0 && <EmptyState message="Không tìm thấy người dùng."/>}
        <Pagination page={users.data.page} totalPages={users.data.totalPages} hasPrevious={users.data.hasPrevious}
                    hasNext={users.data.hasNext} onPageChange={setPage}/>
        <ConfirmDialog open={selected !== null} title={selected?.status === 'ACTIVE' ? 'Tạm ngừng tài khoản?' : 'Khôi phục tài khoản?'}
                       message={selected ? `${selected.fullName}: ${selected.status === 'ACTIVE' ? 'Thao tác sẽ khóa quyền truy cập và thu hồi các phiên đăng nhập.' : 'Tài khoản sẽ có thể đăng nhập trở lại.'}` : ''}
                       confirmLabel={selected?.status === 'ACTIVE' ? 'Tạm ngừng' : 'Khôi phục'} busy={change.isPending}
                       onClose={() => setSelected(null)} onConfirm={() => {
                           if (!selected) return;
                           change.mutate({id: selected.id, status: selected.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE', version: selected.version},
                               {onSettled: () => setSelected(null)});
                       }}/>
    </>;
}
