import {useEffect, useState} from 'react';
import {useForm, useWatch} from 'react-hook-form';
import {z} from 'zod';
import {Link} from 'react-router-dom';
import {useProposals} from './hooks';
import type {ProposalStatus} from '../campaigns/types';
import {proposalStatuses,organizers} from '../campaigns/presentation';
import {errorMessage} from '../../shared/api/errors';
import {Input} from '../../shared/components/Input';
import {Select} from '../../shared/components/Select';
import {Button} from '../../shared/components/Button';
import {Badge} from '../../shared/components/Badge';
import {Table} from '../../shared/components/Table';
import {Pagination} from '../../shared/components/Pagination';
import {LoadingState} from '../../shared/components/LoadingState';
import {EmptyState} from '../../shared/components/EmptyState';
import {ErrorState} from '../../shared/components/ErrorState';
import {useDebouncedValue} from '../../shared/hooks/useDebouncedValue';
export function ProposalListPage({admin=false}:{admin?:boolean}){
    const [page,setPage]=useState(0);const [q,setQ]=useState('');const [status,setStatus]=useState<ProposalStatus|''>(admin?'PENDING':'');
    const form=useForm<{q:string}>({defaultValues:{q:''}});const list=useProposals(admin,page,q,status);
    const query=useDebouncedValue((useWatch({control:form.control,name:'q'})||'').trim());
    useEffect(()=>{if(z.string().max(200).safeParse(query).success){setQ(query);setPage(0);}},[query]);
    return <div className="space-y-5"><div className="flex flex-wrap justify-between gap-3"><h1 className="text-3xl font-semibold">{admin?'Duyệt đề xuất':'Đề xuất của tôi'}</h1>{!admin&&<Link className="text-primary hover:underline" to="/proposals/new">Tạo đề xuất</Link>}</div>
        <form className="flex flex-wrap gap-3" onSubmit={form.handleSubmit(v=>{const result=z.string().trim().max(200).safeParse(v.q);if(result.success){setQ(result.data);setPage(0);}else form.setError('q',{message:'Tìm kiếm tối đa 200 ký tự'});})}><Input aria-label="Tìm kiếm đề xuất" className="sm:max-w-md" maxLength={200} {...form.register('q')}/><Button type="submit">Tìm kiếm</Button>{admin&&<Select aria-label="Trạng thái đề xuất" className="sm:max-w-xs" value={status} onChange={e=>{setStatus(e.target.value as ProposalStatus|'');setPage(0);}}><option value="">Tất cả trạng thái</option>{Object.entries(proposalStatuses).map(([value,p])=><option key={value} value={value}>{p.label}</option>)}</Select>}</form>
        {form.formState.errors.q&&<p role="alert" className="text-danger">{form.formState.errors.q.message}</p>}
        {list.isPending?<LoadingState/>:list.isError?<ErrorState message={errorMessage(list.error)} onRetry={()=>void list.refetch()}/>:<>
            {list.data.items.length===0?<EmptyState message="Chưa có đề xuất."/>:<Table caption="Đề xuất"><thead><tr>{['Tiêu đề','Đơn vị tổ chức','Trạng thái','Ngày tạo'].map(x=><th key={x} className="p-4" scope="col">{x}</th>)}</tr></thead><tbody>{list.data.items.map(p=><tr key={p.id} className="border-t border-border"><td className="p-4"><Link className="text-primary hover:underline" to={'/proposals/'+p.id}>{p.title}</Link></td><td className="p-4">{organizers[p.organizerType]}</td><td className="p-4"><Badge tone={proposalStatuses[p.status].tone}>{proposalStatuses[p.status].label}</Badge></td><td className="p-4">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td></tr>)}</tbody></Table>}
            <Pagination {...list.data} onPageChange={setPage}/>
        </>}
    </div>;
}
