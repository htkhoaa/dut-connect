import {displayName} from '../../shared/lib/demoPresentation';
import {CampaignNavigation} from './components/CampaignNavigation';
import {CampaignDashboard} from '../dashboard/CampaignDashboard';
import {useState} from 'react';
import {useParams,Link} from 'react-router-dom';
import {useCampaign,useTransitionCampaign} from './hooks';
import {useAuth} from '../auth/store';
import {campaignStatuses} from './presentation';
import type {CampaignAction,CampaignStatus} from './types';
import {PlanForm} from './components/PlanForm';
import {CampaignManagers} from './components/CampaignManagers';
import {CampaignSkills} from './components/CampaignSkills';
import {errorMessage} from '../../shared/api/errors';
import {Card} from '../../shared/components/Card';
import {Badge} from '../../shared/components/Badge';
import {Button} from '../../shared/components/Button';
import {ConfirmDialog} from '../../shared/components/ConfirmDialog';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
const commands:Record<CampaignStatus,{command:CampaignAction['command'];label:string}[]>={
    DRAFT:[{command:'open',label:'Mở tuyển chiến dịch'},{command:'cancel',label:'Hủy chiến dịch'}],
    OPEN:[{command:'start',label:'Bắt đầu chiến dịch'},{command:'cancel',label:'Hủy chiến dịch'}],
    ACTIVE:[{command:'complete',label:'Hoàn thành chiến dịch'},{command:'cancel',label:'Hủy chiến dịch'}],COMPLETED:[],CANCELLED:[]
};
export function CampaignWorkspacePage(){
    const {campaignId=''}=useParams();
    return <CampaignWorkspace key={campaignId} campaignId={campaignId}/>;
}
function CampaignWorkspace({campaignId}:{campaignId:string}){
    const query=useCampaign(campaignId);const mutation=useTransitionCampaign(campaignId);const user=useAuth(s=>s.user);
    const [action,setAction]=useState<CampaignAction|null>(null);const [reload,setReload]=useState(false);
    if(query.isPending)return <LoadingState/>;if(query.isError)return <ErrorState message={errorMessage(query.error)} onRetry={()=>void query.refetch()}/>;
    const c=query.data;if(!c.ownRole&&user?.role!=='ADMIN')return <ErrorState message="Bạn cần quyền quản lý chiến dịch."/>;
    return <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0"><p className="eyebrow mb-2 text-primary">KHÔNG GIAN CHIẾN DỊCH</p><h1 className="break-words text-3xl font-bold">{displayName(c.content.title)}</h1><div className="mt-3"><Badge tone={campaignStatuses[c.status].tone}>{campaignStatuses[c.status].label}</Badge></div></div>
            <Button variant="secondary" onClick={()=>setReload(true)}>Tải lại chiến dịch</Button>
        </div>
        <div className="flex flex-wrap gap-4 text-sm"><Link className="font-medium text-primary" to={'/campaigns/'+c.slug}>Xem trang công khai →</Link><Link className="text-text-secondary" to="/manage/campaigns">← Chiến dịch tôi quản lý</Link></div>
        <CampaignNavigation id={c.id}/><CampaignDashboard campaignId={c.id}/>
        {<Card><h2 className="mb-4 text-xl font-semibold">Trạng thái chiến dịch</h2>{c.canManage&&<div className="flex flex-wrap gap-3">{commands[c.status].map(a=><Button key={a.command} disabled={mutation.isPending} onClick={()=>setAction({command:a.command,version:c.version})}>{a.label}</Button>)}</div>}{mutation.isError&&<div className="mt-4"><ErrorState message={errorMessage(mutation.error)}/></div>}{mutation.isSuccess&&<p role="status" className="mt-4 text-success">Đã cập nhật trạng thái chiến dịch.</p>}</Card>}
        {c.canManage&&<Card><h2 className="mb-5 text-xl font-semibold">Chỉnh sửa chiến dịch</h2><PlanForm key={c.id} kind="campaign" id={c.id} content={c.content} version={c.version} categoryName={c.categoryName} organizationName={c.organizerName} modeLocked={c.status!=='DRAFT'}/></Card>}
        <Card><CampaignManagers key={c.id} campaign={c}/></Card>
        {c.canManage&&<Card><CampaignSkills key={c.id} campaign={c}/></Card>}
        {!c.canManage&&<p className="text-text-secondary">Chiến dịch hiện chỉ cho phép xem.</p>}
        <ConfirmDialog open={action!==null} title={action?commands[c.status].find(a=>a.command===action.command)?.label+'?':''} message={action?.command==='complete'||action?.command==='cancel'?'Đây là trạng thái cuối cùng. Chiến dịch không thể mở lại hoặc chỉnh sửa.':'Xác nhận chuyển trạng thái chiến dịch.'} busy={mutation.isPending} confirmLabel="Xác nhận" onClose={()=>setAction(null)} onConfirm={()=>{if(action)mutation.mutate(action,{onSettled:()=>setAction(null)});}}/>
        <ConfirmDialog open={reload} title="Tải lại chiến dịch?" message="Các thay đổi chưa lưu sẽ bị mất." confirmLabel="Tải lại" onClose={()=>setReload(false)} onConfirm={()=>window.location.reload()}/>
    </div>;
}
