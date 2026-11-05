export interface CertificateData {
    fullName: string;
    studentId: string;
    faculty?: string;
    className?: string;
    campaignTitle: string;
    verifiedHours: string;
    verifiedAt?: string;
    organizerName?: string;
}

export function exportVolunteerCertificate(data: CertificateData) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dateStr = data.verifiedAt ? new Date(data.verifiedAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN');

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Chung_nhan_tinh_nguyen_${data.studentId}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 0;
        }
        body {
            margin: 0;
            padding: 40px;
            font-family: 'Times New Roman', Times, serif;
            background: #fff;
            color: #172842;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            box-sizing: border-box;
        }
        .cert-container {
            width: 960px;
            height: 640px;
            border: 12px double #1556d5;
            padding: 30px;
            position: relative;
            box-sizing: border-box;
            background: radial-gradient(circle at 50% 50%, #ffffff 0%, #f6f9fe 100%);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            text-align: center;
        }
        .header {
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .school-name {
            font-size: 15px;
            font-weight: bold;
            color: #1556d5;
        }
        .sub-name {
            font-size: 13px;
            color: #555;
            margin-top: 3px;
        }
        .cert-title {
            font-size: 32px;
            font-weight: bold;
            color: #1556d5;
            margin: 20px 0 10px;
            letter-spacing: 2px;
        }
        .recipient-intro {
            font-size: 16px;
            font-style: italic;
            color: #444;
        }
        .recipient-name {
            font-size: 30px;
            font-weight: bold;
            color: #172842;
            margin: 10px 0;
            border-bottom: 2px solid #1556d5;
            display: inline-block;
            padding: 0 40px 5px;
        }
        .details {
            font-size: 16px;
            line-height: 1.8;
            margin: 15px 0;
        }
        .campaign-name {
            font-size: 18px;
            font-weight: bold;
            color: #1556d5;
        }
        .hours-badge {
            font-size: 18px;
            font-weight: bold;
            color: #168260;
        }
        .footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 30px;
            padding: 0 40px;
            font-size: 14px;
        }
        .seal-box {
            text-align: center;
        }
        .seal {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            border: 3px solid #cf3b51;
            color: #cf3b51;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            margin: 0 auto 5px;
            transform: rotate(-15deg);
        }
        @media print {
            body { padding: 0; }
            .cert-container { width: 100vw; height: 100vh; border-width: 8px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="cert-container">
        <div class="header">
            <div class="school-name">ĐẠI HỌC ĐÀ NẴNG · TRƯỜNG ĐẠI HỌC BÁCH KHOA</div>
            <div class="sub-name">NỀN TẢNG ĐIỀU PHỐI TÌNH NGUYỆN DUT CONNECT</div>
            <div class="cert-title">GIẤY CHỨNG NHẬN</div>
            <div class="recipient-intro">Chứng nhận sinh viên:</div>
        </div>

        <div>
            <div class="recipient-name">${data.fullName}</div>
            <div class="details">
                Mã sinh viên: <strong>${data.studentId}</strong>
                ${data.className ? ` &nbsp;·&nbsp; Lớp: <strong>${data.className}</strong>` : ''}
                ${data.faculty ? ` &nbsp;·&nbsp; Khoa: <strong>${data.faculty}</strong>` : ''}
                <br>
                Đã hoàn thành xuất sắc hoạt động tình nguyện vì cộng đồng trong chiến dịch:
                <br>
                <span class="campaign-name">“${data.campaignTitle}”</span>
                <br>
                Số giờ tình nguyện được ghi nhận chính thức: <span class="hours-badge">${data.verifiedHours} GIỜ</span>
            </div>
        </div>

        <div class="footer">
            <div class="seal-box">
                <div class="seal">DUT<br>CONNECT</div>
                <div>Xác thực số hệ thống</div>
            </div>
            <div>
                <i>Đà Nẵng, ngày ${dateStr}</i><br>
                <strong>BAN TỔ CHỨC CHIẾN DỊCH</strong><br>
                <br><br><br>
                <strong>${data.organizerName || 'Đoàn Thanh niên - Hội Sinh viên DUT'}</strong>
            </div>
        </div>
    </div>
    <script>
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}

export function exportCampaignPdfReport(campaignTitle: string, dashboardData: any) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const op = dashboardData?.operations || {};
    const fin = dashboardData?.financialSummary || {};

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Bao_cao_tong_ket_${campaignTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}</title>
    <style>
        @page { size: A4 portrait; margin: 20mm; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #172842;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
        }
        .header {
            border-bottom: 2px solid #1556d5;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .school {
            font-size: 13px;
            font-weight: bold;
            color: #1556d5;
            text-transform: uppercase;
        }
        h1 {
            font-size: 24px;
            color: #1556d5;
            margin: 10px 0 5px;
        }
        .date { font-size: 12px; color: #666; }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            border-left: 4px solid #1556d5;
            padding-left: 8px;
            margin: 20px 0 10px;
            color: #1556d5;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 13px;
        }
        th, td {
            border: 1px solid #e3e8f0;
            padding: 8px 12px;
            text-align: left;
        }
        th { background: #f3f6fb; font-weight: 600; }
        .highlight { font-weight: bold; color: #1556d5; }
        .footer {
            margin-top: 40px;
            display: flex;
            justify-content: flex-end;
            text-align: center;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="school">ĐẠI HỌC ĐÀ NẴNG · TRƯỜNG ĐẠI HỌC BÁCH KHOA · DUT CONNECT</div>
        <h1>BÁO CÁO TỔNG KẾT CHIẾN DỊCH</h1>
        <div class="date">Chiến dịch: <strong>${campaignTitle}</strong> · Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}</div>
    </div>

    <div class="section-title">1. TỔNG KẾT NHÂN LỰC & ĐIỀU PHỐI TÌNH NGUYỆN</div>
    <table>
        <tr><th width="50%">Hạng mục</th><th>Số lượng</th></tr>
        <tr><td>Tổng lượt sinh viên đăng ký tham gia</td><td>${op.applications?.TOTAL ?? 0}</td></tr>
        <tr><td>Số tình nguyện viên được chấp nhận chính thức</td><td class="highlight">${op.applications?.ACCEPTED ?? 0}</td></tr>
        <tr><td>Phân công nhóm Kỹ thuật (Technical)</td><td>${op.assignedTracks?.TECHNICAL ?? 0}</td></tr>
        <tr><td>Phân công nhóm Hậu cần (Logistics)</td><td>${op.assignedTracks?.LOGISTICS ?? 0}</td></tr>
        <tr><td>Tổng số nhiệm vụ đã hoàn thành & xác minh</td><td>${op.tasks?.VERIFIED ?? 0} / ${op.tasks?.DONE ?? 0}</td></tr>
        <tr><td>Số buổi điểm danh đã tổ chức</td><td>${op.attendanceSessionCount ?? 0}</td></tr>
        <tr><td>Số tình nguyện viên hoàn thành được cấp chứng nhận</td><td class="highlight">${op.verifiedCompletionCount ?? 0}</td></tr>
        <tr><td>Tổng số giờ tình nguyện được xác minh chính thức</td><td class="highlight">${op.verifiedVolunteerHours ?? '0.00'} GIỜ</td></tr>
    </table>

    <div class="section-title">2. TỔNG KẾT THU CHI TÀI CHÍNH</div>
    <table>
        <tr><th width="50%">Khoản mục tài chính</th><th>Số tiền (VND)</th></tr>
        <tr><td>Kinh phí nhà trường cấp</td><td>${fin.institutionalFunding || '0'} đ</td></tr>
        <tr><td>Kinh phí tài trợ từ đối tác</td><td>${fin.sponsorFunding || '0'} đ</td></tr>
        <tr><td>Đóng góp từ cộng đồng và nhà hảo tâm (đã xác nhận)</td><td class="highlight">${fin.verifiedDonations || '0'} đ</td></tr>
        <tr><td><strong>Tổng kinh phí vận động được</strong></td><td class="highlight">${fin.totalFunding || '0'} đ</td></tr>
        <tr><td>Tổng các khoản chi phí thực tế đã được duyệt</td><td>${fin.approvedExpenses || '0'} đ</td></tr>
        <tr><td><strong>Số dư kinh phí còn lại</strong></td><td class="highlight">${fin.remainingFunds || '0'} đ</td></tr>
    </table>

    <div class="footer">
        <div>
            <i>Đà Nẵng, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}</i><br>
            <strong>ĐẠI DIỆN BAN QUẢN LÝ CHIẾN DỊCH</strong><br>
            <br><br><br>
            <i>(Ký và ghi rõ họ tên)</i>
        </div>
    </div>

    <script>
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}
