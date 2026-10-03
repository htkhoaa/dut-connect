import {useEffect, useState} from 'react';
import {useForm, useWatch} from 'react-hook-form';
import {z} from 'zod';
import {Link} from 'react-router-dom';
import {useOrganizations} from './hooks';
import {organizationStatuses} from './presentation';
import type {OrganizationScope, OrganizationStatus} from './types';
import {useAuth} from '../auth/store';
import {errorMessage} from '../../shared/api/errors';
import {Button} from '../../shared/components/Button';
import {Input} from '../../shared/components/Input';
import {Select} from '../../shared/components/Select';
import {Badge} from '../../shared/components/Badge';
import {Table} from '../../shared/components/Table';
import {Pagination} from '../../shared/components/Pagination';
import {LoadingState} from '../../shared/components/LoadingState';
import {EmptyState} from '../../shared/components/EmptyState';
import {ErrorState} from '../../shared/components/ErrorState';
import {OrganizationCard} from './components/OrganizationCard';
import {PageHeader} from '../../shared/components/PageHeader';
import {Icon} from '../../shared/components/Icon';
import {catalogLabel} from '../../shared/lib/catalogLabels';
import {useDebouncedValue} from '../../shared/hooks/useDebouncedValue';

export function OrganizationListPage({scope = 'public'}: {scope?: OrganizationScope}) {
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<OrganizationStatus | ''>('');
    const form = useForm<{q: string}>({defaultValues: {q: ''}});
    const query = useDebouncedValue((useWatch({control: form.control, name: 'q'}) || '').trim());
    useEffect(() => {
        if (z.string().max(200).safeParse(query).success) {setSearch(query); setPage(0);}
    }, [query]);
    const list = useOrganizations(scope, page, search, status);
    const user = useAuth(state => state.user);
    return <>
        <PageHeader eyebrow={scope === 'public' ? 'CỘNG ĐỒNG DUT' : 'KẾT NỐI & QUẢN LÝ'} title={scope === 'mine' ? 'Tổ chức của bạn' : scope === 'admin' ? 'Xác minh tổ chức' : 'Cùng một mục tiêu. Cùng tạo thay đổi.'} description={scope === 'public' ? 'Gặp gỡ các đoàn, hội, câu lạc bộ và đội sinh viên. Tìm một cộng đồng phù hợp để cùng bạn cống hiến.' : 'Theo dõi tổ chức, vai trò thành viên và trạng thái xác minh.'} actions={user && scope !== 'admin' ? <Link className="button-link" to="/organizations/new"><Icon name="building" size={17}/>Tạo tổ chức</Link> : undefined}/>
        {scope !== 'mine' && <form onSubmit={form.handleSubmit(input => {
            const parsed = z.string().trim().max(200).safeParse(input.q);
            if (!parsed.success) {form.setError('q', {message: 'Tìm kiếm tối đa 200 ký tự'}); return;}
            setSearch(parsed.data); setPage(0);
        })} className="filter-panel mb-6 flex flex-wrap gap-3">
            <div className="min-w-0 flex-1"><Input aria-label="Tìm kiếm tổ chức" placeholder="Tìm theo tên" maxLength={200} {...form.register('q')}/></div>
            <Button type="submit">Tìm kiếm</Button>
            <p className="w-full text-xs text-text-secondary">Kết quả tự cập nhật khi bạn nhập.</p>
            {scope === 'admin' && <div className="w-full sm:w-56"><Select aria-label="Trạng thái tổ chức" value={status} onChange={event => {setStatus(event.target.value as OrganizationStatus | ''); setPage(0);}}>
                <option value="">Tất cả trạng thái</option>{Object.entries(organizationStatuses).map(([value, presentation]) => <option key={value} value={value}>{presentation.label}</option>)}
            </Select></div>}
            {form.formState.errors.q && <p role="alert" className="w-full text-danger">{form.formState.errors.q.message}</p>}
        </form>}
        {list.isPending ? <LoadingState/> : list.isError ? <ErrorState message={errorMessage(list.error)} onRetry={() => void list.refetch()}/> : <>
            <p className="mb-3 text-sm text-text-secondary">{list.data.totalElements} tổ chức</p>
            {list.data.items.length === 0 ? <EmptyState message={scope === 'mine' ? 'Bạn chưa tham gia tổ chức nào.' : 'Chưa tìm thấy tổ chức.'}/> :
                scope !== 'admin' ? <div className="campaign-grid">{list.data.items.map(o => <OrganizationCard key={o.id} organization={o}/>)}</div> : <Table caption="Tổ chức"><thead className="bg-surface-muted"><tr>{['Tên', 'Loại', 'Trạng thái', 'Ngày tạo'].map(label => <th key={label} scope="col" className="p-4">{label}</th>)}</tr></thead>
                    <tbody>{list.data.items.map(organization => <tr key={organization.id} className="border-t border-border">
                        <td className="p-4"><Link className="font-medium text-primary hover:underline" to={'/organizations/' + organization.id}>{organization.name}</Link></td>
                        <td className="p-4">{catalogLabel(organization.organizationTypeName)}</td>
                        <td className="p-4"><Badge tone={organizationStatuses[organization.status].tone}>{organizationStatuses[organization.status].label}</Badge></td>
                        <td className="p-4">{new Date(organization.createdAt).toLocaleDateString('vi-VN')}</td>
                    </tr>)}</tbody>
                </Table>}
            <Pagination page={list.data.page} totalPages={list.data.totalPages} hasNext={list.data.hasNext} hasPrevious={list.data.hasPrevious} onPageChange={setPage}/>
        </>}
    </>;
}
