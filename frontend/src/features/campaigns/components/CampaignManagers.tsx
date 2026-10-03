import {useState} from 'react';
import {useForm} from 'react-hook-form';
import {z} from 'zod';
import type {CampaignDetail,Manager,TeamAction} from '../types';
import {useTeam,useChangeTeam} from '../hooks';
import {apiError,errorMessage} from '../../../shared/api/errors';
import {FormField} from '../../../shared/components/FormField';
import {Input} from '../../../shared/components/Input';
import {Button} from '../../../shared/components/Button';
import {Table} from '../../../shared/components/Table';
import {Pagination} from '../../../shared/components/Pagination';
import {ConfirmDialog} from '../../../shared/components/ConfirmDialog';
import {LoadingState} from '../../../shared/components/LoadingState';
import {EmptyState} from '../../../shared/components/EmptyState';
import {ErrorState} from '../../../shared/components/ErrorState';
export function CampaignManagers({campaign}:{campaign:CampaignDetail}){
    const [page,setPage]=useState(0);const [remove,setRemove]=useState<{manager:Manager;action:TeamAction}|null>(null);
    const [feedback,setFeedback]=useState('');const list=useTeam(campaign.id,page);const mutation=useChangeTeam(campaign.id);
    const form=useForm<{studentId:string}>({defaultValues:{studentId:''}});
    const submit=form.handleSubmit(async v=>{
        const parsed=z.string().trim().min(1,'Nhập mã sinh viên').max(32).safeParse(v.studentId);
        if(!parsed.success){form.setError('studentId',{message:parsed.error.issues[0].message});return;}
        try{setFeedback('');await mutation.mutateAsync({command:'add',studentId:parsed.data,version:campaign.version});form.reset();setFeedback('Đã thêm người quản lý.');}
        catch(error){form.setError('root',{message:errorMessage(error)});for(const field of apiError(error)?.fieldErrors||[])if(field.field==='studentId')form.setError('studentId',{message:field.message});}
    });
    return <section className="space-y-4"><h2 className="text-xl font-semibold">Người quản lý chiến dịch</h2>
        {campaign.canAssignManagers&&<form className="space-y-3" noValidate onSubmit={submit}><p className="text-sm text-text-secondary">Thêm sinh viên đang hoạt động bằng mã sinh viên. Chiến dịch của tổ chức yêu cầu người quản lý là thành viên tổ chức.</p><FormField id="campaign-manager-student" label="Mã sinh viên" error={form.formState.errors.studentId?.message}><Input id="campaign-manager-student" maxLength={32} disabled={mutation.isPending} {...form.register('studentId')}/></FormField><Button type="submit" disabled={mutation.isPending}>{mutation.isPending?'Đang lưu…':'Thêm người quản lý'}</Button></form>}
        {mutation.isError&&<ErrorState message={errorMessage(mutation.error)}/>}
        {feedback&&<p role="status" className="text-success">{feedback}</p>}
        {list.isPending?<LoadingState/>:list.isError?<ErrorState message={errorMessage(list.error)} onRetry={()=>void list.refetch()}/>:<>
            {list.data.items.length===0?<EmptyState message="Chưa có người quản lý."/>:<Table caption="Người quản lý chiến dịch"><thead><tr>{['Họ tên / Mã sinh viên','Vai trò',...(campaign.canAssignManagers?['Thao tác']:[])].map(x=><th className="p-4" scope="col" key={x}>{x}</th>)}</tr></thead><tbody>{list.data.items.map(m=><tr className="border-t border-border" key={m.userId}><td className="p-4">{m.fullName}<br/><span className="text-text-secondary">{m.studentId}</span></td><td className="p-4">{m.managerRole==='OWNER'?'Chủ sở hữu':'Người quản lý'}</td>{campaign.canAssignManagers&&<td className="p-4">{m.managerRole==='MANAGER'&&<Button disabled={mutation.isPending} onClick={()=>setRemove({manager:m,action:{command:'remove',userId:m.userId,version:campaign.version}})}>Xóa</Button>}</td>}</tr>)}</tbody></Table>}
            <Pagination {...list.data} onPageChange={setPage}/>
        </>}
        <ConfirmDialog open={remove!==null} title="Xóa quyền quản lý chiến dịch?" message={remove?'Xóa quyền quản lý của '+remove.manager.fullName+'?':''} busy={mutation.isPending} confirmLabel="Xóa" onClose={()=>setRemove(null)} onConfirm={()=>{if(remove)mutation.mutate(remove.action,{onSuccess:()=>setFeedback('Đã xóa quyền quản lý.'),onSettled:()=>setRemove(null)});}}/>
    </section>;
}
