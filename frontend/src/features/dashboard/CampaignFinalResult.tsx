import {useState, useRef} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useLanguage, tr} from "../../shared/lib/i18n";
import type {CampaignDashboard} from './types';
import {Button} from '../../shared/components/Button';
import {Card} from '../../shared/components/Card';
import {Icon} from '../../shared/components/Icon';
import {apiClient} from '../../shared/api/client';
import {vnd} from '../campaigns/presentation';

interface GalleryItem {
    id: string;
    imageUrl: string;
    caption?: string;
}

interface Props {
    title: string;
    data: CampaignDashboard;
    campaignId?: string;
    categoryName?: string;
    organizerName?: string;
    mode?: string;
}

function escapeXml(value: string) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function CampaignFinalResult({title, data, campaignId, categoryName, organizerName}: Props) {
    useLanguage();
    const [activeTab, setActiveTab] = useState<'poster' | 'social'>('poster');
    const [selectedPhoto, setSelectedPhoto] = useState<string>('/images/dut-campus-main.jpg');
    const [copied, setCopied] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const galleryQuery = useQuery({
        queryKey: ['campaign-gallery', campaignId],
        queryFn: async () => {
            if (!campaignId) return [];
            return (await apiClient.get<GalleryItem[]>(`/campaigns/${campaignId}/gallery`)).data;
        },
        enabled: !!campaignId,
    });

    const galleryImages = galleryQuery.data ?? [];
    const activePhoto = galleryImages.length > 0 && selectedPhoto === '/images/dut-campus-main.jpg'
        ? galleryImages[0].imageUrl
        : selectedPhoto;

    const volunteers = data.operations.applications.ACCEPTED;
    const verifiedVolunteers = data.operations.verifiedCompletionCount;
    const hours = data.operations.verifiedVolunteerHours;
    const donations = data.financialSummary.verifiedDonations;
    const donationCount = data.financialSummary.successfulDonationCount;
    const goal = data.financialSummary.fundraisingGoal;
    const goalNum = goal ? Number(goal) : 0;
    const donationNum = Number(donations);
    const progressPercent = goalNum > 0 ? Math.min(Math.round((donationNum / goalNum) * 100), 200) : 100;
    const tasksDone = data.operations.tasks.DONE + data.operations.tasks.VERIFIED;
    const totalTasks = data.operations.tasks.TODO + data.operations.tasks.IN_PROGRESS + tasksDone;

    const formattedDonations = vnd(donations);
    const formattedGoal = goal ? vnd(goal) : tr("Chưa đặt mục tiêu");

    const generatePosterSvg = () => {
        const escapedTitle = escapeXml(title);
        const escapedCategory = escapeXml(categoryName || "Cộng đồng DUT");
        const escapedOrganizer = escapeXml(organizerName || "Trường Đại học Bách khoa - ĐHĐN");

        return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
      <defs>
        <linearGradient id="bg-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0b2447" />
          <stop offset="45%" stop-color="#19376d" />
          <stop offset="100%" stop-color="#0a4d68" />
        </linearGradient>
        <linearGradient id="card-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.96" />
          <stop offset="100%" stop-color="#f8fafc" stop-opacity="0.92" />
        </linearGradient>
        <linearGradient id="gold-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#fbbf24" />
        </linearGradient>
        <filter id="drop-shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" flood-opacity="0.25" />
        </filter>
        <clipPath id="hero-photo-clip">
          <rect x="90" y="270" width="460" height="340" rx="24" />
        </clipPath>
      </defs>

      <!-- Background with subtle lighting -->
      <rect width="1600" height="1000" fill="url(#bg-grad)" />
      <circle cx="150" cy="120" r="300" fill="#2563eb" fill-opacity="0.18" />
      <circle cx="1450" cy="850" r="350" fill="#059669" fill-opacity="0.15" />
      <circle cx="1500" cy="150" r="280" fill="#38bdf8" fill-opacity="0.12" />

      <!-- Top Header Navigation -->
      <g transform="translate(90, 80)">
        <!-- DUT Shield Emblem -->
        <rect x="0" y="0" width="56" height="56" rx="14" fill="#ffffff" />
        <text x="28" y="36" font-family="Arial, sans-serif" font-size="22" font-weight="900" fill="#0b2447" text-anchor="middle">DUT</text>

        <!-- University Title -->
        <text x="75" y="25" fill="#f8fafc" font-family="Arial, sans-serif" font-size="22" font-weight="800" letter-spacing="0.5">TRƯỜNG ĐẠI HỌC BÁCH KHOA - ĐẠI HỌC ĐÀ NẴNG</text>
        <text x="75" y="50" fill="#93c5fd" font-family="Arial, sans-serif" font-size="15" font-weight="600" letter-spacing="1.5">DUT CONNECT · BÁO CÁO TỔNG KẾT KẾT QUẢ CHIẾN DỊCH</text>
      </g>

      <!-- Completion Badge Top Right -->
      <g transform="translate(1250, 75)">
        <rect width="260" height="46" rx="23" fill="url(#gold-grad)" />
        <text x="130" y="29" fill="#0f172a" font-family="Arial, sans-serif" font-size="16" font-weight="800" text-anchor="middle">★ HOÀN THÀNH 100%</text>
      </g>

      <!-- Campaign Title Header -->
      <g transform="translate(90, 185)">
        <rect x="0" y="-22" width="140" height="28" rx="8" fill="#38bdf8" fill-opacity="0.2" />
        <text x="10" y="-3" fill="#7dd3fc" font-family="Arial, sans-serif" font-size="14" font-weight="700">${escapedCategory}</text>
        <text x="160" y="-3" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="14">Đơn vị tổ chức: <tspan fill="#ffffff" font-weight="700">${escapedOrganizer}</tspan></text>

        <text x="0" y="42" fill="#ffffff" font-family="Arial, sans-serif" font-size="44" font-weight="900">${escapedTitle}</text>
      </g>

      <!-- Left Column: Hero Campaign Photo Frame -->
      <g>
        <rect x="85" y="265" width="470" height="350" rx="28" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2" />
        <image href="${activePhoto}" x="90" y="270" width="460" height="340" preserveAspectRatio="xMidYMid slice" clip-path="url(#hero-photo-clip)" />
        <rect x="90" y="550" width="460" height="60" rx="0" fill="#0f172a" fill-opacity="0.65" clip-path="url(#hero-photo-clip)" />
        <text x="110" y="585" fill="#ffffff" font-family="Arial, sans-serif" font-size="15" font-weight="700">Hình ảnh hoạt động chiến dịch DUT Connect</text>
      </g>

      <!-- Right Column: 4 Key Metric Cards -->
      <g font-family="Arial, sans-serif">
        <!-- Card 1: Gây quỹ tài chính -->
        <g transform="translate(585, 265)" filter="url(#drop-shadow)">
          <rect width="440" height="160" rx="22" fill="url(#card-grad)" />
          <circle cx="50" cy="50" r="26" fill="#ecfdf5" />
          <text x="50" y="58" font-size="24" text-anchor="middle">💰</text>
          <text x="90" y="44" fill="#047857" font-size="16" font-weight="700">TỔNG KINH PHÍ ĐÃ GÂY QUỸ</text>
          <text x="90" y="90" fill="#065f46" font-size="34" font-weight="900">${formattedDonations}</text>
          <text x="90" y="125" fill="#475569" font-size="15">Mục tiêu: ${formattedGoal} · <tspan fill="#059669" font-weight="700">${progressPercent}% đạt được</tspan></text>
        </g>

        <!-- Card 2: Số lượt ủng hộ -->
        <g transform="translate(1055, 265)" filter="url(#drop-shadow)">
          <rect width="455" height="160" rx="22" fill="url(#card-grad)" />
          <circle cx="50" cy="50" r="26" fill="#eff6ff" />
          <text x="50" y="58" font-size="24" text-anchor="middle">❤️</text>
          <text x="90" y="44" fill="#1d4ed8" font-size="16" font-weight="700">SỐ LƯỢT ĐÓNG GÓP ỦNG HỘ</text>
          <text x="90" y="90" fill="#1e3a8a" font-size="34" font-weight="900">${donationCount} <tspan font-size="20" font-weight="600">lượt</tspan></text>
          <text x="90" y="125" fill="#475569" font-size="15">Minh bạch 100% qua tài khoản dự án DUT</text>
        </g>

        <!-- Card 3: Tình nguyện viên -->
        <g transform="translate(585, 455)" filter="url(#drop-shadow)">
          <rect width="440" height="160" rx="22" fill="url(#card-grad)" />
          <circle cx="50" cy="50" r="26" fill="#fef3c7" />
          <text x="50" y="58" font-size="24" text-anchor="middle">👥</text>
          <text x="90" y="44" fill="#b45309" font-size="16" font-weight="700">TÌNH NGUYỆN VIÊN THAM GIA</text>
          <text x="90" y="90" fill="#92400e" font-size="34" font-weight="900">${volunteers} <tspan font-size="20" font-weight="600">bạn</tspan></text>
          <text x="90" y="125" fill="#475569" font-size="15">Đã hoàn thành xác minh: <tspan fill="#b45309" font-weight="700">${verifiedVolunteers} sinh viên</tspan></text>
        </g>

        <!-- Card 4: Giờ đóng góp & Nhiệm vụ -->
        <g transform="translate(1055, 455)" filter="url(#drop-shadow)">
          <rect width="455" height="160" rx="22" fill="url(#card-grad)" />
          <circle cx="50" cy="50" r="26" fill="#f3e8ff" />
          <text x="50" y="58" font-size="24" text-anchor="middle">⏱️</text>
          <text x="90" y="44" fill="#7e22ce" font-size="16" font-weight="700">TỔNG SỐ GIỜ CỐNG HIẾN</text>
          <text x="90" y="90" fill="#581c87" font-size="34" font-weight="900">${hours} <tspan font-size="20" font-weight="600">giờ</tspan></text>
          <text x="90" y="125" fill="#475569" font-size="15">Nhiệm vụ hoàn thành: <tspan fill="#7e22ce" font-weight="700">${tasksDone}/${totalTasks || tasksDone}</tspan></text>
        </g>
      </g>

      <!-- Bottom Appreciation Banner -->
      <g transform="translate(90, 660)">
        <rect width="1420" height="200" rx="26" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.18" stroke-width="1.5" />
        
        <text x="50" y="60" fill="#fbbf24" font-family="Arial, sans-serif" font-size="24" font-weight="800">LAN TỎA GIÁ TRỊ TÍCH CỰC ĐẾN CỘNG ĐỒNG</text>
        <text x="50" y="105" fill="#ffffff" font-family="Arial, sans-serif" font-size="20" font-weight="400">Chân thành cảm ơn sự đồng hành, ủng hộ và cống hiến nhiệt tình của Quý Thầy Cô,</text>
        <text x="50" y="140" fill="#ffffff" font-family="Arial, sans-serif" font-size="20" font-weight="400">Quý Nhà hảo tâm, Cựu sinh viên và các bạn Sinh viên Trường Đại học Bách khoa - ĐHĐN!</text>

        <!-- Right Side Verification Badge -->
        <g transform="translate(1120, 45)">
          <rect width="250" height="110" rx="18" fill="#ffffff" fill-opacity="0.12" />
          <text x="125" y="45" fill="#e2e8f0" font-family="Arial, sans-serif" font-size="13" font-weight="700" text-anchor="middle">XÁC NHẬN MINH BẠCH</text>
          <text x="125" y="75" fill="#38bdf8" font-family="Arial, sans-serif" font-size="17" font-weight="800" text-anchor="middle">DUT CONNECT 2026</text>
          <text x="125" y="95" fill="#94a3b8" font-family="Arial, sans-serif" font-size="12" text-anchor="middle">dutconnect.udn.vn</text>
        </g>
      </g>

      <!-- Footer Info -->
      <text x="90" y="930" fill="#94a3b8" font-family="Arial, sans-serif" font-size="16">Mỗi hành động nhỏ đều tạo nên một giá trị lớn cho cộng đồng Bách khoa.</text>
      <text x="1510" y="930" fill="#38bdf8" font-family="Arial, sans-serif" font-size="16" font-weight="700" text-anchor="end">dut-connect.udn.vn</text>
    </svg>`;
    };

    const downloadSvg = () => {
        const svgContent = generatePosterSvg();
        const blob = new Blob([svgContent], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `DUT-Connect-Ket-qua-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const downloadPng = () => {
        const svgContent = generatePosterSvg();
        const svgBlob = new Blob([svgContent], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 1600;
            canvas.height = 1000;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = pngUrl;
                downloadLink.download = `DUT-Connect-Poster-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
                downloadLink.click();
            }
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    const socialPostContent = `📢 [TỔNG KẾT CHIẾN DỊCH] ${title}
Trường Đại học Bách khoa - Đại học Đà Nẵng | Hệ thống DUT Connect

Kính gửi Quý Thầy Cô, Quý Nhà hảo tâm, các anh chị Cựu sinh viên và các bạn Sinh viên Bách khoa thân mến!

Chiến dịch "${title}" do ${organizerName || "Trường Đại học Bách khoa"} khởi xướng trên nền tảng DUT Connect đã chính thức khép lại với những kết quả và dấu ấn vô cùng ý nghĩa:

🌟 NHỮNG CON SỐ ẤN TƯỢNG ĐÃ ĐẠT ĐƯỢC:
💰 Kinh phí gây quỹ: ${formattedDonations} (${progressPercent}% mục tiêu)
❤️ Lượt ủng hộ thiện nguyện: ${donationCount} lượt
👥 Lực lượng tình nguyện viên: ${volunteers} bạn sinh viên tham gia (${verifiedVolunteers} bạn đã hoàn thành xuất sắc)
⏱️ Tổng số giờ cống hiến: ${hours} giờ tình nguyện vì cộng đồng
✓ Nhiệm vụ đã triển khai: ${tasksDone} nhiệm vụ hoàn tất

Xin chân thành cảm ơn sự chung tay đồng hành, tinh thần trách nhiệm và nghĩa cử cao đẹp của toàn thể cộng đồng. Ban Tổ chức đã gửi Thư cảm ơn chính thức kèm Giấy chứng nhận có chữ ký và con dấu của Trường Đại học Bách khoa - ĐHĐN tới từng sinh viên và nhà hảo tâm.

👉 Theo dõi chi tiết báo cáo và hình ảnh chiến dịch tại: dut-connect.udn.vn

#DUTConnect #BachKhoaDaNang #TuHaoDUT #TinhNguyenDUT #KetQuaChienDich`;

    const copySocialPost = async () => {
        try {
            await navigator.clipboard.writeText(socialPostContent);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            alert(tr("Không thể sao chép, vui lòng thử lại"));
        }
    };

    const svgSource = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(generatePosterSvg())}`;

    return (
        <Card className="overflow-hidden border border-border shadow-lg">
            {/* Header with Tab Navigation */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                    <span className="eyebrow text-primary">{tr("TỔNG KẾT CHIẾN DỊCH")}</span>
                    <h2 className="text-xl font-bold text-text-primary">{tr("Tạo post & Poster kết quả")}</h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-xl bg-surface-muted p-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('poster')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                activeTab === 'poster'
                                    ? 'bg-surface text-primary shadow-xs'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            🖼️ {tr("Poster Đồ Họa")}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('social')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                activeTab === 'social'
                                    ? 'bg-surface text-primary shadow-xs'
                                    : 'text-text-secondary hover:text-text-primary'
                            }`}
                        >
                            📝 {tr("Bài Đăng Mạng Xã Hội")}
                        </button>
                    </div>

                    {activeTab === 'poster' && (
                        <div className="flex gap-2">
                            <Button variant="secondary" onClick={downloadSvg} className="text-xs py-1.5">
                                <Icon name="file" size={15} />
                                {tr("Tải vector SVG")}
                            </Button>
                            <Button variant="primary" onClick={downloadPng} className="text-xs py-1.5 font-semibold shadow-xs">
                                <Icon name="check" size={15} />
                                {tr("Tải poster PNG (HD)")}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Photo Selection Row (if gallery images exist) */}
            {galleryImages.length > 0 && activeTab === 'poster' && (
                <div className="mb-4 rounded-xl border border-border bg-surface-muted/50 p-3">
                    <p className="mb-2 text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                        <Icon name="grid" size={14} />
                        {tr("Chọn ảnh chiến dịch hiển thị trên Poster:")}
                    </p>
                    <div className="flex gap-2.5 overflow-x-auto pb-1">
                        {galleryImages.map((img) => (
                            <button
                                key={img.id}
                                type="button"
                                onClick={() => setSelectedPhoto(img.imageUrl)}
                                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                                    activePhoto === img.imageUrl
                                        ? 'border-primary ring-2 ring-primary/30'
                                        : 'border-transparent opacity-75 hover:opacity-100'
                                }`}
                            >
                                <img src={img.imageUrl} alt="gallery" className="h-full w-full object-cover" />
                                {activePhoto === img.imageUrl && (
                                    <span className="absolute top-1 right-1 rounded-full bg-primary p-0.5 text-white">
                                        <Icon name="check" size={10} />
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab 1: Poster View */}
            {activeTab === 'poster' && (
                <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-2xl shadow-xl border border-border">
                        <img
                            src={svgSource}
                            alt={tr("Poster kết quả chiến dịch")}
                            className="w-full h-auto block"
                        />
                    </div>
                    <canvas ref={canvasRef} className="hidden" />
                    <p className="text-center text-xs text-text-secondary">
                        {tr("Poster được thiết kế theo kích thước chuẩn 16:9 chất lượng cao, tích hợp số liệu tài chính, tình nguyện và hình ảnh thực tế của chiến dịch.")}
                    </p>
                </div>
            )}

            {/* Tab 2: Social Media Post Content */}
            {activeTab === 'social' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-text-secondary">
                            {tr("Nội dung bài viết được tạo sẵn với đầy đủ số liệu và hashtag, phù hợp đăng tải lên Facebook, Fanpage, Zalo và Cổng thông tin:")}
                        </p>
                        <Button
                            variant={copied ? "secondary" : "primary"}
                            onClick={copySocialPost}
                            className="text-xs font-semibold"
                        >
                            {copied ? (
                                <span className="flex items-center gap-1.5 text-emerald-600">
                                    <Icon name="check" size={14} />
                                    {tr("Đã sao chép vào clipboard!")}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5">
                                    📋 {tr("Sao chép bài viết")}
                                </span>
                            )}
                        </Button>
                    </div>

                    <div className="rounded-xl border border-border bg-surface-muted p-4">
                        <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-text-primary">
                            {socialPostContent}
                        </pre>
                    </div>
                </div>
            )}
        </Card>
    );
}
