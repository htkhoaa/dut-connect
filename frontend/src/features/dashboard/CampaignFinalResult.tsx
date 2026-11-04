import {useLanguage, tr} from "../../shared/lib/i18n";
import type {CampaignDashboard} from './types';
import {Button} from '../../shared/components/Button';
import {Card} from '../../shared/components/Card';
import {Icon} from '../../shared/components/Icon';

function text(value:string) {
    return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function poster(title:string, data:CampaignDashboard) {
    const volunteers=data.operations.applications.ACCEPTED;
    const verified=data.operations.verifiedCompletionCount;
    const hours=data.operations.verifiedVolunteerHours;
    const donations=data.financialSummary.verifiedDonations;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#123c8c"/><stop offset=".52" stop-color="#187a9e"/><stop offset="1" stop-color="#22a06b"/></linearGradient><radialGradient id="glow"><stop stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
      <rect width="1600" height="900" rx="44" fill="url(#bg)"/><circle cx="1420" cy="120" r="330" fill="url(#glow)"/><circle cx="120" cy="820" r="300" fill="url(#glow)"/>
      <text x="100" y="130" fill="#d9fff0" font-family="Arial,sans-serif" font-size="30" font-weight="700">DUT CONNECT · FINAL RESULT</text>
      <text x="100" y="230" fill="#fff" font-family="Arial,sans-serif" font-size="64" font-weight="800">${text(title)}</text>
      <text x="100" y="290" fill="#e1fff5" font-family="Arial,sans-serif" font-size="30">Cảm ơn cộng đồng đã cùng tạo nên thay đổi</text>
      <g font-family="Arial,sans-serif" fill="#123c8c"><rect x="100" y="390" width="330" height="220" rx="28" fill="#fff"/><rect x="465" y="390" width="330" height="220" rx="28" fill="#fff"/><rect x="830" y="390" width="330" height="220" rx="28" fill="#fff"/><rect x="1195" y="390" width="305" height="220" rx="28" fill="#fff"/>
      <text x="140" y="465" font-size="26">Tình nguyện viên</text><text x="140" y="555" font-size="68" font-weight="800">${text(String(volunteers))}</text>
      <text x="505" y="465" font-size="26">Hoàn thành xác minh</text><text x="505" y="555" font-size="68" font-weight="800">${text(String(verified))}</text>
      <text x="870" y="465" font-size="26">Giờ đóng góp</text><text x="870" y="555" font-size="68" font-weight="800">${text(hours)}</text>
      <text x="1235" y="465" font-size="26">Đã gây quỹ</text><text x="1235" y="555" font-size="48" font-weight="800">${text(donations)} đ</text></g>
      <text x="100" y="760" fill="#fff" font-family="Arial,sans-serif" font-size="28">Mỗi hành động nhỏ đều tạo ra một giá trị lớn cho DUT.</text><text x="100" y="820" fill="#d9fff0" font-family="Arial,sans-serif" font-size="22">dutconnect.vercel.app</text>
    </svg>`;
}

export function CampaignFinalResult({title, data}: {title:string; data:CampaignDashboard}) {
    useLanguage();
    const source=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(poster(title,data))}`;
    const download=()=>{const link=document.createElement('a');link.href=source;link.download=`dut-connect-${title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-final-result.svg`;link.click();};
    return <Card><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow text-primary">{tr("KẾT QUẢ CUỐI CHIẾN DỊCH")}</p><h2 className="text-xl font-semibold">{tr("Poster tổng kết")}</h2></div><Button variant="secondary" onClick={download}><Icon name="file" size={17}/>{tr("Tải ảnh kết quả")}</Button></div><img className="w-full rounded-2xl shadow-lg" src={source} alt={tr("Ảnh tổng kết chiến dịch")}/></Card>;
}
