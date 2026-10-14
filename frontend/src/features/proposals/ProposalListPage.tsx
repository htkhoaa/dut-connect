import {useLanguage, tr, renderText, locale} from "../../shared/lib/i18n";
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
    useLanguage();
    const [page,setPage]=useState(0);const [q,setQ]=useState('');const [status,setStatus]=useState<ProposalStatus|''>(admin?'PENDING':'');
    const form=useForm<{q:string}>({defaultValues:{q:''}});const list=useProposals(admin,page,q,status);
    const query=useDebouncedValue((useWatch({control:form.control,name:'q'})||'').trim());
    useEffect(()=>{if(z.string().max(200).safeParse(query).success){setQ(query);setPage(0);}},[query]);
    return <div className="space-y-5"><div className="flex flex-wrap justify-between gap-3"><h1 className="text-3xl font-semibold">{renderText(admin?tr("Duyệt đề xuất"):tr("Đề xuất của tôi"))}</h1>{renderText(!admin&&<Link className="text-primary hover:underline" to="/proposals/new">{tr("Tạo đề xuất")}</Link>)}</div>
        <form className="flex flex-wrap gap-3" onSubmit={form.handleSubmit(v=>{const result=z.string().trim().max(200).safeParse(v.q);if(result.success){setQ(result.data);setPage(0);}else form.setError('q',{message:tr("Tìm kiếm tối đa 200 ký tự")});})}><Input aria-label={tr("Tìm kiếm đề xuất")} className="sm:max-w-md" maxLength={200} {...form.register('q')}/><Button type="submit">{tr("Tìm kiếm")}</Button>{renderText(admin&&<Select aria-label={tr("Trạng thái đề xuất")} className="sm:max-w-xs" value={status} onChange={e=>{setStatus(e.target.value as ProposalStatus|'');setPage(0);}}><option value="">{tr("Tất cả trạng thái")}</option>{renderText(Object.entries(proposalStatuses).map(([value,p])=><option key={value} value={value}>{renderText(p.label)}</option>))}</Select>)}</form>
        {renderText(form.formState.errors.q&&<p role="alert" className="text-danger">{renderText(form.formState.errors.q.message)}</p>)}
        {renderText(list.isPending?<LoadingState/>:list.isError?<ErrorState message={errorMessage(list.error)} onRetry={()=>void list.refetch()}/>:<>
            {list.data.items.length===0?<EmptyState message={tr("Chưa có đề xuất.")}/>:<Table caption={tr("Đề xuất")}><thead><tr>{renderText([tr("Tiêu đề"),tr("Đơn vị tổ chức"),tr("Trạng thái"),tr("Ngày tạo")].map(x=><th key={x} className="p-4" scope="col">{renderText(x)}</th>))}</tr></thead><tbody>{renderText(list.data.items.map(p=><tr key={p.id} className="border-t border-border"><td className="p-4"><Link className="text-primary hover:underline" to={'/proposals/'+p.id}>{renderText(p.title)}</Link></td><td className="p-4">{renderText(organizers[p.organizerType])}</td><td className="p-4"><Badge tone={proposalStatuses[p.status].tone}>{renderText(proposalStatuses[p.status].label)}</Badge></td><td className="p-4">{renderText(new Date(p.createdAt).toLocaleDateString(locale()))}</td></tr>))}</tbody></Table>}
            <Pagination {...list.data} onPageChange={setPage}/>
        </>)}
    </div>;
}
