import {useLanguage, tr, renderText} from "../../shared/lib/i18n";
import {Link,useParams} from 'react-router-dom';
import {useDownloadReport} from './hooks';
import {useCampaignDashboard} from '../dashboard/hooks';
import {Card} from '../../shared/components/Card';
import {Button} from '../../shared/components/Button';
import {LoadingState} from '../../shared/components/LoadingState';
import {ErrorState} from '../../shared/components/ErrorState';
import {errorMessage} from '../../shared/api/errors';
export function ReportsPage(){
    useLanguage();const {campaignId=''}=useParams();return <Reports key={campaignId} campaignId={campaignId}/>;}
function Reports({campaignId}:{campaignId:string}){
    useLanguage();
    const access=useCampaignDashboard(campaignId);const download=useDownloadReport(campaignId);
    if(access.isPending)return <LoadingState/>;
    if(access.isError)return <ErrorState message={errorMessage(access.error)} onRetry={()=>void access.refetch()}/>;
    return <div className="space-y-6"><h1 className="text-3xl font-semibold">{tr("Báo cáo chiến dịch")}</h1><Link className="ui-button ui-button-secondary" to={'/manage/campaigns/'+campaignId}>{tr("Không gian chiến dịch")}</Link>
        <Card><h2 className="mb-3 text-xl font-semibold">{tr("Báo cáo tình nguyện Excel")}</h2><p className="mb-4 text-text-secondary">{tr("Đăng ký tham gia, nhóm đóng góp và điểm danh theo từng buổi.")}</p><Button disabled={download.isPending} onClick={()=>download.mutate('volunteers')}>{tr("Tải báo cáo tình nguyện")}</Button></Card>

        <p className="text-sm text-text-secondary">{tr("Mã sinh viên được giữ chính xác trong Excel. Báo cáo lấy dữ liệu tại thời điểm tải.")}</p>
        {renderText(download.isPending&&<p role="status">{tr("Đang chuẩn bị tải…")}</p>)}{renderText(download.isSuccess&&<p role="status" className="text-success">{tr("Đã bắt đầu tải báo cáo.")}</p>)}{renderText(download.isError&&<ErrorState message={errorMessage(download.error)}/>)}
    </div>;
}
