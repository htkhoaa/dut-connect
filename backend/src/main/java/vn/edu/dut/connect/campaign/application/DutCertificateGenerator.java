package vn.edu.dut.connect.campaign.application;

import java.awt.*;
import java.awt.geom.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Objects;
import javax.imageio.ImageIO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class DutCertificateGenerator {
    private static final Logger log = LoggerFactory.getLogger(DutCertificateGenerator.class);

    public record CertificateData(
            String certCode,
            String studentName,
            String studentId,
            String campaignTitle,
            ContributionType contributionType,
            String contributionDetail,
            String issueDate
    ) {
        public enum ContributionType {
            DONATION,
            VOLUNTEER
        }
    }

    public byte[] generatePng(CertificateData data) {
        int width = 1600;
        int height = 1100;
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();

        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);

            // 1. Background - Premium ivory parchment gradient
            GradientPaint bgGradient = new GradientPaint(0, 0, new Color(254, 253, 249), width, height, new Color(244, 247, 252));
            g.setPaint(bgGradient);
            g.fillRect(0, 0, width, height);

            // 2. Borders - Double frame: Navy & Gold
            // Outer Navy Border
            g.setColor(new Color(15, 43, 92)); // DUT Navy
            g.setStroke(new BasicStroke(7.0f));
            g.drawRect(40, 40, width - 80, height - 80);

            // Inner Gold Border
            g.setColor(new Color(197, 155, 39)); // Gold
            g.setStroke(new BasicStroke(2.5f));
            g.drawRect(55, 55, width - 110, height - 110);

            // Thin Accent Border
            g.setColor(new Color(15, 43, 92, 90));
            g.setStroke(new BasicStroke(1.0f));
            g.drawRect(65, 65, width - 130, height - 130);

            // Corner decorative brackets (Flourishes)
            drawCornerFlourishes(g, 55, 55, width - 110, height - 110);

            // 3. Center Watermark Emblem (subtle)
            drawWatermark(g, width / 2, height / 2 - 20);

            // 4. Header Section
            // Top Left: Đại học Đà Nẵng / Bách khoa
            g.setColor(new Color(15, 43, 92));
            g.setFont(new Font("Serif", Font.BOLD, 19));
            g.drawString("ĐẠI HỌC ĐÀ NẴNG", 95, 115);
            g.setFont(new Font("Serif", Font.BOLD, 22));
            g.drawString("TRƯỜNG ĐẠI HỌC BÁCH KHOA", 95, 145);
            g.setColor(new Color(197, 155, 39));
            g.setFont(new Font("SansSerif", Font.BOLD, 13));
            g.drawString("HỆ THỐNG ĐỒNG HÀNH DUT CONNECT", 95, 170);
            g.setColor(new Color(15, 43, 92, 120));
            g.setStroke(new BasicStroke(1.5f));
            g.drawLine(95, 180, 420, 180);

            // Top Center: University Logo
            drawUniversityLogo(g, width / 2, 130);

            // Top Right: Quốc hiệu & Tiêu ngữ
            g.setColor(new Color(15, 43, 92));
            g.setFont(new Font("Serif", Font.BOLD, 18));
            drawCenteredString(g, "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", width - 290, 115);
            g.setFont(new Font("Serif", Font.BOLD | Font.ITALIC, 17));
            drawCenteredString(g, "Độc lập - Tự do - Hạnh phúc", width - 290, 145);
            g.setColor(new Color(197, 155, 39));
            g.setStroke(new BasicStroke(2.0f));
            g.drawLine(width - 400, 160, width - 180, 160);

            // 5. Main Title: GIẤY CHỨNG NHẬN
            g.setColor(new Color(15, 43, 92));
            g.setFont(new Font("Serif", Font.BOLD, 46));
            drawCenteredString(g, "GIẤY CHỨNG NHẬN", width / 2, 275);

            g.setColor(new Color(180, 131, 24)); // Gold
            g.setFont(new Font("Serif", Font.BOLD | Font.ITALIC, 18));
            String subTitle = data.contributionType() == CertificateData.ContributionType.DONATION
                    ? "CERTIFICATE OF COMMENDATION · FINANCIAL SUPPORT"
                    : "CERTIFICATE OF RECOGNITION · VOLUNTEERING CONTRIBUTION";
            drawCenteredString(g, subTitle, width / 2, 310);

            // Granting Authority
            g.setColor(new Color(55, 65, 81));
            g.setFont(new Font("Serif", Font.BOLD, 18));
            drawCenteredString(g, "HIỆU TRƯỞNG TRƯỜNG ĐẠI HỌC BÁCH KHOA - ĐẠI HỌC ĐÀ NẴNG", width / 2, 355);
            g.setColor(new Color(15, 43, 92));
            g.setFont(new Font("Serif", Font.BOLD, 20));
            drawCenteredString(g, "TRÂN TRỌNG CHỨNG NHẬN", width / 2, 385);

            // 6. Recipient Name & Student ID
            g.setColor(new Color(75, 85, 99));
            g.setFont(new Font("Serif", Font.PLAIN, 18));
            drawCenteredString(g, "Trao tặng Anh/Chị:", width / 2, 435);

            g.setColor(new Color(15, 43, 92));
            g.setFont(new Font("Serif", Font.BOLD, 40));
            String name = Objects.requireNonNullElse(data.studentName(), "Sinh viên Bách khoa").toUpperCase();
            drawCenteredString(g, name, width / 2, 485);

            g.setColor(new Color(31, 41, 55));
            g.setFont(new Font("SansSerif", Font.BOLD, 18));
            String studentIdText = "Mã số sinh viên: " + Objects.requireNonNullElse(data.studentId(), "---");
            drawCenteredString(g, studentIdText, width / 2, 520);

            // 7. Achievement Statement
            g.setColor(new Color(55, 65, 81));
            g.setFont(new Font("Serif", Font.PLAIN, 20));

            if (data.contributionType() == CertificateData.ContributionType.DONATION) {
                drawCenteredString(g, "Đã tích cực tham gia đóng góp ủng hộ tài chính cho chiến dịch:", width / 2, 575);
                g.setColor(new Color(15, 43, 92));
                g.setFont(new Font("Serif", Font.BOLD, 25));
                drawCenteredString(g, "« " + data.campaignTitle() + " »", width / 2, 615);

                g.setColor(new Color(16, 120, 68)); // Forest Green
                g.setFont(new Font("SansSerif", Font.BOLD, 22));
                drawCenteredString(g, "Số tiền đóng góp: " + data.contributionDetail() + " VNĐ", width / 2, 655);

                g.setColor(new Color(75, 85, 99));
                g.setFont(new Font("Serif", Font.ITALIC, 17));
                drawCenteredString(g, "Ghi nhận tấm lòng nhân ái, tinh thần trách nhiệm và sự đồng hành quý báu", width / 2, 695);
                drawCenteredString(g, "cùng các hoạt động thiện nguyện vì cộng đồng của Trường Đại học Bách khoa - ĐHĐN.", width / 2, 722);
            } else {
                drawCenteredString(g, "Đã tích cực tham gia và hoàn thành xuất sắc hoạt động tình nguyện trong chiến dịch:", width / 2, 575);
                g.setColor(new Color(15, 43, 92));
                g.setFont(new Font("Serif", Font.BOLD, 25));
                drawCenteredString(g, "« " + data.campaignTitle() + " »", width / 2, 615);

                g.setColor(new Color(16, 120, 68)); // Forest Green
                g.setFont(new Font("SansSerif", Font.BOLD, 22));
                drawCenteredString(g, "Ghi nhận cống hiến: " + data.contributionDetail(), width / 2, 655);

                g.setColor(new Color(75, 85, 99));
                g.setFont(new Font("Serif", Font.ITALIC, 17));
                drawCenteredString(g, "Thành tích được ghi nhận chính thức vào tiêu chí rèn luyện và hoạt động xã hội", width / 2, 695);
                drawCenteredString(g, "của sinh viên Trường Đại học Bách khoa - Đại học Đà Nẵng.", width / 2, 722);
            }

            // 8. Footer Section
            // Bottom Left: Certificate Reference & Online Verification
            int footerY = 875;
            g.setColor(new Color(75, 85, 99));
            g.setFont(new Font("SansSerif", Font.BOLD, 14));
            g.drawString("Số hiệu: DUT-CONNECT/" + data.certCode(), 110, footerY);
            g.setFont(new Font("SansSerif", Font.PLAIN, 13));
            g.drawString("Tra cứu trực tuyến: dut-connect.udn.vn", 110, footerY + 24);
            g.setColor(new Color(107, 114, 128));
            g.drawString("Mã xác thực: " + data.certCode(), 110, footerY + 46);

            // Mini Verification QR / Shield Graphic
            drawVerificationBadge(g, 110, footerY + 65);

            // Bottom Right: Date & Signatures & Official University Stamp
            int rightCenterX = width - 330;
            g.setColor(new Color(55, 65, 81));
            g.setFont(new Font("Serif", Font.ITALIC, 17));
            drawCenteredString(g, "Đà Nẵng, " + Objects.requireNonNullElse(data.issueDate(), "năm 2026"), rightCenterX, footerY);

            g.setColor(new Color(15, 43, 92));
            g.setFont(new Font("Serif", Font.BOLD, 19));
            drawCenteredString(g, "HIỆU TRƯỞNG", rightCenterX, footerY + 30);

            // Official Red Seal Stamp (Con dấu đỏ)
            drawRedSeal(g, rightCenterX - 45, footerY + 60);

            // Signature (Cursive ink)
            drawSignature(g, rightCenterX + 10, footerY + 80);

            // Signatory Name
            g.setColor(new Color(15, 43, 92));
            g.setFont(new Font("Serif", Font.BOLD, 18));
            drawCenteredString(g, "PGS. TS. NGUYỄN ĐÌNH LÂM", rightCenterX, footerY + 145);

            g.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", baos);
            return baos.toByteArray();
        } catch (Exception ex) {
            log.error("Failed to generate certificate PNG", ex);
            throw new IllegalStateException("Failed to generate certificate PNG: " + ex.getMessage(), ex);
        } finally {
            g.dispose();
        }
    }

    public String generateSvg(CertificateData data) {
        String name = escape(Objects.requireNonNullElse(data.studentName(), "Sinh viên Bách khoa").toUpperCase());
        String id = escape(Objects.requireNonNullElse(data.studentId(), "---"));
        String title = escape(Objects.requireNonNullElse(data.campaignTitle(), "Chiến dịch DUT Connect"));
        String detail = escape(Objects.requireNonNullElse(data.contributionDetail(), "---"));
        String date = escape(Objects.requireNonNullElse(data.issueDate(), "năm 2026"));
        String code = escape(Objects.requireNonNullElse(data.certCode(), "DUT-CERT-2026"));

        boolean isDonation = data.contributionType() == CertificateData.ContributionType.DONATION;
        String subEng = isDonation
                ? "CERTIFICATE OF COMMENDATION · FINANCIAL SUPPORT"
                : "CERTIFICATE OF RECOGNITION · VOLUNTEERING CONTRIBUTION";

        String actionLine = isDonation
                ? "Đã tích cực tham gia đóng góp ủng hộ tài chính cho chiến dịch:"
                : "Đã tích cực tham gia và hoàn thành xuất sắc hoạt động tình nguyện trong chiến dịch:";

        String highlightLine = isDonation
                ? "Số tiền đóng góp: " + detail + " VNĐ"
                : "Ghi nhận cống hiến: " + detail;

        String impactLine1 = isDonation
                ? "Ghi nhận tấm lòng nhân ái, tinh thần trách nhiệm và sự đồng hành quý báu"
                : "Thành tích được ghi nhận chính thức vào tiêu chí rèn luyện và hoạt động xã hội";

        String impactLine2 = isDonation
                ? "cùng các hoạt động thiện nguyện vì cộng đồng của Trường Đại học Bách khoa - ĐHĐN."
                : "của sinh viên Trường Đại học Bách khoa - Đại học Đà Nẵng.";

        return """
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1100" width="1600" height="1100">
              <defs>
                <linearGradient id="cert-bg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%%" stop-color="#fefdf9"/>
                  <stop offset="100%%" stop-color="#f4f7fc"/>
                </linearGradient>
                <filter id="shadow" x="-5%%" y="-5%%" width="110%%" height="110%%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.15"/>
                </filter>
              </defs>

              <!-- Background -->
              <rect width="1600" height="1100" fill="url(#cert-bg)"/>

              <!-- Outer Navy Border -->
              <rect x="40" y="40" width="1520" height="1020" fill="none" stroke="#0f2b5c" stroke-width="7"/>
              <!-- Inner Gold Border -->
              <rect x="55" y="55" width="1490" height="990" fill="none" stroke="#c59b27" stroke-width="2.5"/>
              <rect x="65" y="65" width="1470" height="970" fill="none" stroke="#0f2b5c" stroke-opacity="0.35" stroke-width="1"/>

              <!-- Corner Ornaments -->
              <g stroke="#c59b27" stroke-width="2" fill="none">
                <path d="M 60 90 L 90 90 L 90 60" />
                <path d="M 1540 90 L 1510 90 L 1510 60" />
                <path d="M 60 1010 L 90 1010 L 90 1040" />
                <path d="M 1540 1010 L 1510 1010 L 1510 1040" />
              </g>

              <!-- Watermark DUT Emblem -->
              <g transform="translate(800, 520)" opacity="0.04" fill="#0f2b5c">
                <circle r="220" />
              </g>

              <!-- Top Left Header -->
              <g font-family="Times New Roman, Georgia, serif">
                <text x="95" y="115" font-size="19" font-weight="bold" fill="#0f2b5c">ĐẠI HỌC ĐÀ NẴNG</text>
                <text x="95" y="145" font-size="22" font-weight="bold" fill="#0f2b5c">TRƯỜNG ĐẠI HỌC BÁCH KHOA</text>
                <text x="95" y="170" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#c59b27">HỆ THỐNG ĐỒNG HÀNH DUT CONNECT</text>
                <line x1="95" y1="180" x2="420" y2="180" stroke="#0f2b5c" stroke-opacity="0.5" stroke-width="1.5" />
              </g>

              <!-- Top Center: University Emblem -->
              <g transform="translate(800, 140)">
                <circle cx="0" cy="0" r="42" fill="#0f2b5c" filter="url(#shadow)"/>
                <circle cx="0" cy="0" r="37" fill="#ffffff" stroke="#c59b27" stroke-width="2"/>
                <text x="0" y="8" font-family="Arial, sans-serif" font-size="20" font-weight="900" fill="#0f2b5c" text-anchor="middle">DUT</text>
                <text x="0" y="24" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#c59b27" text-anchor="middle">1975</text>
              </g>

              <!-- Top Right Header -->
              <g font-family="Times New Roman, Georgia, serif" text-anchor="middle">
                <text x="1310" y="115" font-size="18" font-weight="bold" fill="#0f2b5c">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</text>
                <text x="1310" y="145" font-size="17" font-weight="bold" font-style="italic" fill="#0f2b5c">Độc lập - Tự do - Hạnh phúc</text>
                <line x1="1200" y1="160" x2="1420" y2="160" stroke="#c59b27" stroke-width="2" />
              </g>

              <!-- Main Title -->
              <g text-anchor="middle">
                <text x="800" y="275" font-family="Times New Roman, Georgia, serif" font-size="46" font-weight="bold" fill="#0f2b5c" letter-spacing="2">GIẤY CHỨNG NHẬN</text>
                <text x="800" y="310" font-family="Times New Roman, Georgia, serif" font-size="17" font-weight="bold" font-style="italic" fill="#b48318" letter-spacing="1">%s</text>

                <text x="800" y="355" font-family="Times New Roman, Georgia, serif" font-size="18" font-weight="bold" fill="#374151">HIỆU TRƯỞNG TRƯỜNG ĐẠI HỌC BÁCH KHOA - ĐẠI HỌC ĐÀ NẴNG</text>
                <text x="800" y="385" font-family="Times New Roman, Georgia, serif" font-size="20" font-weight="bold" fill="#0f2b5c">TRÂN TRỌNG CHỨNG NHẬN</text>

                <!-- Student Information -->
                <text x="800" y="435" font-family="Times New Roman, Georgia, serif" font-size="18" fill="#4b5563">Trao tặng Anh/Chị:</text>
                <text x="800" y="485" font-family="Times New Roman, Georgia, serif" font-size="40" font-weight="bold" fill="#0f2b5c">%s</text>
                <text x="800" y="520" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1f2937">Mã số sinh viên: %s</text>

                <!-- Achievement Citation -->
                <text x="800" y="575" font-family="Times New Roman, Georgia, serif" font-size="20" fill="#374151">%s</text>
                <text x="800" y="615" font-family="Times New Roman, Georgia, serif" font-size="25" font-weight="bold" fill="#0f2b5c">« %s »</text>
                <text x="800" y="655" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#107844">%s</text>

                <text x="800" y="695" font-family="Times New Roman, Georgia, serif" font-size="17" font-style="italic" fill="#4b5563">%s</text>
                <text x="800" y="722" font-family="Times New Roman, Georgia, serif" font-size="17" font-style="italic" fill="#4b5563">%s</text>
              </g>

              <!-- Footer Section -->
              <!-- Left Reference -->
              <g font-family="Arial, sans-serif" fill="#4b5563">
                <text x="110" y="875" font-size="14" font-weight="bold">Số hiệu: DUT-CONNECT/%s</text>
                <text x="110" y="900" font-size="13">Tra cứu trực tuyến: dut-connect.udn.vn</text>
                <text x="110" y="922" font-size="12" fill="#9ca3af">Mã bảo mật: %s</text>
                <rect x="110" y="935" width="120" height="28" rx="4" fill="#0f2b5c" fill-opacity="0.08"/>
                <text x="170" y="954" font-size="11" font-weight="bold" fill="#0f2b5c" text-anchor="middle">DUT VERIFIED</text>
              </g>

              <!-- Right: Date, Seal & Signature -->
              <g transform="translate(1270, 875)">
                <text x="0" y="0" font-family="Times New Roman, Georgia, serif" font-size="17" font-style="italic" fill="#374151" text-anchor="middle">Đà Nẵng, %s</text>
                <text x="0" y="30" font-family="Times New Roman, Georgia, serif" font-size="19" font-weight="bold" fill="#0f2b5c" text-anchor="middle">HIỆU TRƯỞNG</text>

                <!-- Official Red Stamp (Con dấu đỏ Bách Khoa) -->
                <g transform="translate(-40, 65) rotate(-8)">
                  <circle cx="0" cy="0" r="62" fill="none" stroke="#dc2626" stroke-width="3" stroke-opacity="0.88"/>
                  <circle cx="0" cy="0" r="48" fill="none" stroke="#dc2626" stroke-width="1.5" stroke-opacity="0.88"/>
                  <text x="0" y="-30" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#dc2626" text-anchor="middle" fill-opacity="0.9">ĐẠI HỌC ĐÀ NẴNG</text>
                  <text x="0" y="6" font-family="Arial, sans-serif" font-size="20" fill="#dc2626" text-anchor="middle" fill-opacity="0.9">★</text>
                  <text x="0" y="38" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#dc2626" text-anchor="middle" fill-opacity="0.9">TRƯỜNG ĐH BÁCH KHOA</text>
                </g>

                <!-- Signature path (Blue ink) -->
                <g transform="translate(10, 80)">
                  <path d="M -35 15 Q -10 -25 15 -5 Q 35 15 55 -15 Q 70 -5 90 2" fill="none" stroke="#0f2b5c" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="M -15 2 Q 5 -10 25 10 Q 45 5 60 18" fill="none" stroke="#0f2b5c" stroke-width="2" stroke-linecap="round"/>
                </g>

                <text x="0" y="145" font-family="Times New Roman, Georgia, serif" font-size="18" font-weight="bold" fill="#0f2b5c" text-anchor="middle">PGS. TS. NGUYỄN ĐÌNH LÂM</text>
              </g>
            </svg>
            """.formatted(subEng, name, id, actionLine, title, highlightLine, impactLine1, impactLine2, code, code, date);
    }

    private void drawCornerFlourishes(Graphics2D g, int x, int y, int w, int h) {
        g.setColor(new Color(197, 155, 39));
        g.setStroke(new BasicStroke(2.0f));
        int len = 35;
        // Top-left
        g.drawLine(x + 5, y + 5 + len, x + 5, y + 5);
        g.drawLine(x + 5, y + 5, x + 5 + len, y + 5);
        // Top-right
        g.drawLine(x + w - 5 - len, y + 5, x + w - 5, y + 5);
        g.drawLine(x + w - 5, y + 5, x + w - 5, y + 5 + len);
        // Bottom-left
        g.drawLine(x + 5, y + h - 5 - len, x + 5, y + h - 5);
        g.drawLine(x + 5, y + h - 5, x + 5 + len, y + h - 5);
        // Bottom-right
        g.drawLine(x + w - 5 - len, y + h - 5, x + w - 5, y + h - 5);
        g.drawLine(x + w - 5, y + h - 5, x + w - 5, y + h - 5 - len);
    }

    private void drawWatermark(Graphics2D g, int cx, int cy) {
        g.setColor(new Color(15, 43, 92, 10));
        g.fillOval(cx - 240, cy - 240, 480, 480);
        g.setColor(new Color(197, 155, 39, 15));
        g.setStroke(new BasicStroke(4.0f));
        g.drawOval(cx - 200, cy - 200, 400, 400);
    }

    private void drawUniversityLogo(Graphics2D g, int cx, int cy) {
        try (InputStream is = getClass().getResourceAsStream("/images/dut-logo.png")) {
            if (is != null) {
                BufferedImage logo = ImageIO.read(is);
                if (logo != null) {
                    int size = 80;
                    g.drawImage(logo, cx - size / 2, cy - size / 2, size, size, null);
                    return;
                }
            }
        } catch (Exception ignored) {}

        // Fallback Vector Medallion
        int r = 38;
        g.setColor(new Color(15, 43, 92));
        g.fillOval(cx - r, cy - r, r * 2, r * 2);
        g.setColor(new Color(197, 155, 39));
        g.setStroke(new BasicStroke(2.5f));
        g.drawOval(cx - r, cy - r, r * 2, r * 2);
        g.setColor(Color.WHITE);
        g.setFont(new Font("SansSerif", Font.BOLD, 18));
        drawCenteredString(g, "DUT", cx, cy + 2);
        g.setFont(new Font("SansSerif", Font.PLAIN, 9));
        drawCenteredString(g, "1975", cx, cy + 16);
    }

    private void drawVerificationBadge(Graphics2D g, int x, int y) {
        g.setColor(new Color(15, 43, 92, 20));
        g.fillRoundRect(x, y, 120, 26, 6, 6);
        g.setColor(new Color(15, 43, 92));
        g.setFont(new Font("SansSerif", Font.BOLD, 11));
        g.drawString("DUT VERIFIED", x + 18, y + 17);
    }

    private void drawRedSeal(Graphics2D g, int cx, int cy) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.rotate(Math.toRadians(-8), cx, cy);
        Color redStamp = new Color(220, 38, 38, 225);
        g2.setColor(redStamp);

        int r1 = 60;
        int r2 = 47;
        g2.setStroke(new BasicStroke(3.0f));
        g2.drawOval(cx - r1, cy - r1, r1 * 2, r1 * 2);
        g2.setStroke(new BasicStroke(1.5f));
        g2.drawOval(cx - r2, cy - r2, r2 * 2, r2 * 2);

        g2.setFont(new Font("SansSerif", Font.BOLD, 9));
        drawCenteredString(g2, "ĐẠI HỌC ĐÀ NẴNG", cx, cy - 28);
        g2.setFont(new Font("SansSerif", Font.BOLD, 20));
        drawCenteredString(g2, "★", cx, cy + 7);
        g2.setFont(new Font("SansSerif", Font.BOLD, 8));
        drawCenteredString(g2, "TRƯỜNG ĐH BÁCH KHOA", cx, cy + 36);
        g2.dispose();
    }

    private void drawSignature(Graphics2D g, int x, int y) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setColor(new Color(15, 43, 92));
        g2.setStroke(new BasicStroke(2.5f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
        Path2D p = new Path2D.Float();
        p.moveTo(x - 40, y + 15);
        p.curveTo(x - 15, y - 25, x + 15, y - 5, x + 35, y + 15);
        p.curveTo(x + 55, y - 15, x + 70, y - 5, x + 90, y + 2);
        g2.draw(p);

        Path2D p2 = new Path2D.Float();
        p2.moveTo(x - 20, y + 2);
        p2.curveTo(x, y - 10, x + 20, y + 10, x + 40, y + 5);
        p2.curveTo(x + 55, y + 2, x + 65, y + 15, x + 80, y + 18);
        g2.draw(p2);
        g2.dispose();
    }

    private void drawCenteredString(Graphics2D g, String text, int x, int y) {
        if (text == null) return;
        FontMetrics fm = g.getFontMetrics();
        int textWidth = fm.stringWidth(text);
        g.drawString(text, x - textWidth / 2, y);
    }

    private static String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
