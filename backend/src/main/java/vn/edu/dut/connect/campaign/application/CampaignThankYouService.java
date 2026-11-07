package vn.edu.dut.connect.campaign.application;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.campaign.domain.Campaign;
import vn.edu.dut.connect.campaign.domain.ContributionMode;
import vn.edu.dut.connect.notification.application.NotificationService;
import vn.edu.dut.connect.shared.application.EmailNotificationService;
import static vn.edu.dut.connect.campaign.application.CampaignThankYouContracts.*;

@Service
public class CampaignThankYouService {
    private static final Logger log = LoggerFactory.getLogger(CampaignThankYouService.class);

    private final JdbcClient jdbc;
    private final CampaignAuthorization access;
    private final CampaignAccessPort campaigns;
    private final EmailNotificationService emailService;
    private final NotificationService notificationService;
    private final DutCertificateGenerator certificateGenerator;

    public CampaignThankYouService(
            JdbcClient jdbc,
            CampaignAuthorization access,
            CampaignAccessPort campaigns,
            EmailNotificationService emailService,
            NotificationService notificationService,
            DutCertificateGenerator certificateGenerator) {
        this.jdbc = jdbc;
        this.access = access;
        this.campaigns = campaigns;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.certificateGenerator = certificateGenerator;
    }

    @Transactional(readOnly = true)
    public CampaignRecipientsSummary recipientsSummary(UUID campaignId, UUID actorId) {
        access.manager(campaignId, actorId);
        var campaign = campaigns.getCampaign(campaignId);

        List<ThankYouRecipientDto> donors = getDonors(campaignId);
        List<ThankYouRecipientDto> volunteers = getVolunteers(campaignId);

        return new CampaignRecipientsSummary(
                campaignId,
                campaign.title(),
                campaign.contributionMode().name(),
                donors.size(),
                volunteers.size(),
                donors,
                volunteers
        );
    }

    @Transactional
    public CampaignThankYouResponse sendThankYou(UUID campaignId, UUID actorId, SendThankYouRequest request) {
        access.manager(campaignId, actorId);
        var campaign = campaigns.getCampaign(campaignId);
        String campaignTitle = campaign.title();
        ContributionMode mode = campaign.contributionMode();

        String todayStr = LocalDate.now().format(DateTimeFormatter.ofPattern("'ngày' dd 'tháng' MM 'năm' yyyy"));

        List<ThankYouRecipientDto> sentRecipients = new ArrayList<>();
        int donorsCount = 0;
        int volunteersCount = 0;

        // 1. Process Financial Donors (if campaign mode allows donation)
        if (mode != ContributionMode.VOLUNTEER_ONLY) {
            List<DonorRecord> donorList = queryDonors(campaignId);
            for (DonorRecord d : donorList) {
                String certCode = generateCode("DON", campaignId, d.userId());
                String formattedAmount = String.format("%,d", d.totalAmount().longValue()).replace(',', '.');

                var certData = new DutCertificateGenerator.CertificateData(
                        certCode,
                        d.fullName(),
                        d.studentId(),
                        campaignTitle,
                        DutCertificateGenerator.CertificateData.ContributionType.DONATION,
                        formattedAmount,
                        todayStr
                );

                byte[] pngBytes = certificateGenerator.generatePng(certData);

                String subject = (request != null && request.customSubject() != null && !request.customSubject().isBlank())
                        ? request.customSubject()
                        : "[DUT Connect] Thư cảm ơn & Chứng nhận đóng góp chiến dịch: " + campaignTitle;

                String emailBody = buildDonationEmailHtml(d.fullName(), d.studentId(), campaignTitle, formattedAmount, request != null ? request.customMessage() : null);

                try {
                    emailService.sendWithImageAttachment(
                            d.email(),
                            subject,
                            emailBody,
                            "Giay_Chung_Nhan_DUT_" + d.studentId() + ".png",
                            pngBytes,
                            "image/png"
                    );

                    notificationService.notifyUser(
                            d.userId(),
                            "CAMPAIGN_THANK_YOU",
                            "Thư cảm ơn & Chứng nhận đóng góp: " + campaignTitle,
                            "Ban Tổ chức chiến dịch trân trọng gửi lời cảm ơn và Giấy chứng nhận đóng góp ủng hộ tài chính đến bạn. Vui lòng kiểm tra email để nhận chứng chỉ chính thức!",
                            "CAMPAIGN",
                            campaignId
                    );

                    sentRecipients.add(new ThankYouRecipientDto(
                            d.userId(),
                            d.fullName(),
                            d.studentId(),
                            d.email(),
                            "DONATION",
                            formattedAmount + " đ",
                            true
                    ));
                    donorsCount++;
                } catch (Exception ex) {
                    log.error("Failed to send thank you to donor userId={} email={}: {}", d.userId(), d.email(), ex.getMessage());
                    sentRecipients.add(new ThankYouRecipientDto(
                            d.userId(),
                            d.fullName(),
                            d.studentId(),
                            d.email(),
                            "DONATION",
                            formattedAmount + " đ",
                            false
                    ));
                }
            }
        }

        // 2. Process Volunteers (if campaign mode allows volunteer)
        if (mode != ContributionMode.DONATION_ONLY) {
            List<VolunteerRecord> volunteerList = queryVolunteers(campaignId);
            for (VolunteerRecord v : volunteerList) {
                String certCode = generateCode("VOL", campaignId, v.userId());
                String hoursDetail = v.verifiedHours().compareTo(BigDecimal.ZERO) > 0
                        ? v.verifiedHours().stripTrailingZeros().toPlainString() + " GIỜ TÌNH NGUYỆN"
                        : "THAM GIA TÍCH CỰC";

                var certData = new DutCertificateGenerator.CertificateData(
                        certCode,
                        v.fullName(),
                        v.studentId(),
                        campaignTitle,
                        DutCertificateGenerator.CertificateData.ContributionType.VOLUNTEER,
                        hoursDetail,
                        todayStr
                );

                byte[] pngBytes = certificateGenerator.generatePng(certData);

                String subject = (request != null && request.customSubject() != null && !request.customSubject().isBlank())
                        ? request.customSubject()
                        : "[DUT Connect] Thư cảm ơn & Chứng nhận tham gia chiến dịch: " + campaignTitle;

                String emailBody = buildVolunteerEmailHtml(v.fullName(), v.studentId(), campaignTitle, hoursDetail, request != null ? request.customMessage() : null);

                try {
                    emailService.sendWithImageAttachment(
                            v.email(),
                            subject,
                            emailBody,
                            "Giay_Chung_Nhan_DUT_" + v.studentId() + ".png",
                            pngBytes,
                            "image/png"
                    );

                    notificationService.notifyUser(
                            v.userId(),
                            "CAMPAIGN_THANK_YOU",
                            "Thư cảm ơn & Chứng nhận tình nguyện: " + campaignTitle,
                            "Ban Tổ chức chiến dịch trân trọng gửi lời cảm ơn và Giấy chứng nhận tham gia tình nguyện đến bạn. Vui lòng kiểm tra email để nhận chứng chỉ chính thức!",
                            "CAMPAIGN",
                            campaignId
                    );

                    sentRecipients.add(new ThankYouRecipientDto(
                            v.userId(),
                            v.fullName(),
                            v.studentId(),
                            v.email(),
                            "VOLUNTEER",
                            hoursDetail,
                            true
                    ));
                    volunteersCount++;
                } catch (Exception ex) {
                    log.error("Failed to send thank you to volunteer userId={} email={}: {}", v.userId(), v.email(), ex.getMessage());
                    sentRecipients.add(new ThankYouRecipientDto(
                            v.userId(),
                            v.fullName(),
                            v.studentId(),
                            v.email(),
                            "VOLUNTEER",
                            hoursDetail,
                            false
                    ));
                }
            }
        }

        int totalSent = donorsCount + volunteersCount;
        log.info("Sent thank-you emails for campaignId={} totalSent={} donors={} volunteers={}", campaignId, totalSent, donorsCount, volunteersCount);

        String summaryMessage = String.format("Đã gửi thành công %d thư cảm ơn và chứng chỉ xác nhận của Trường Đại học Bách khoa (Gồm %d sinh viên ủng hộ tài chính và %d tình nguyện viên).",
                totalSent, donorsCount, volunteersCount);

        return new CampaignThankYouResponse(
                donorsCount,
                volunteersCount,
                totalSent,
                summaryMessage,
                sentRecipients
        );
    }

    @Transactional(readOnly = true)
    public String previewCertificateSvg(UUID campaignId, UUID actorId, String type) {
        access.manager(campaignId, actorId);
        var campaign = campaigns.getCampaign(campaignId);
        boolean isVolunteer = "VOLUNTEER".equalsIgnoreCase(type);
        String todayStr = LocalDate.now().format(DateTimeFormatter.ofPattern("'ngày' dd 'tháng' MM 'năm' yyyy"));

        var certData = new DutCertificateGenerator.CertificateData(
                "DUT-SAMPLE-2026",
                "NGUYỄN VĂN AN",
                "102210001",
                campaign.title(),
                isVolunteer ? DutCertificateGenerator.CertificateData.ContributionType.VOLUNTEER : DutCertificateGenerator.CertificateData.ContributionType.DONATION,
                isVolunteer ? "30 GIỜ TÌNH NGUYỆN" : "500.000",
                todayStr
        );

        return certificateGenerator.generateSvg(certData);
    }

    private List<ThankYouRecipientDto> getDonors(UUID campaignId) {
        return queryDonors(campaignId).stream()
                .map(d -> new ThankYouRecipientDto(
                        d.userId(),
                        d.fullName(),
                        d.studentId(),
                        d.email(),
                        "DONATION",
                        String.format("%,d", d.totalAmount().longValue()).replace(',', '.') + " đ",
                        false
                ))
                .toList();
    }

    private List<ThankYouRecipientDto> getVolunteers(UUID campaignId) {
        return queryVolunteers(campaignId).stream()
                .map(v -> new ThankYouRecipientDto(
                        v.userId(),
                        v.fullName(),
                        v.studentId(),
                        v.email(),
                        "VOLUNTEER",
                        v.verifiedHours().compareTo(BigDecimal.ZERO) > 0
                                ? v.verifiedHours().stripTrailingZeros().toPlainString() + " giờ"
                                : "Tham gia",
                        false
                ))
                .toList();
    }

    private record DonorRecord(UUID userId, String studentId, String fullName, String email, BigDecimal totalAmount) {}

    private List<DonorRecord> queryDonors(UUID campaignId) {
        return jdbc.sql("""
            select u.id as user_id, u.student_id, u.full_name, u.email, sum(d.amount) as total_amount
            from dut_connect.donations d
            join dut_connect.users u on u.id = d.donor_user_id
            where d.campaign_id = :id and d.status = 'PAID'
            group by u.id, u.student_id, u.full_name, u.email
            order by sum(d.amount) desc, u.full_name
            """)
                .param("id", campaignId)
                .query((rs, n) -> new DonorRecord(
                        rs.getObject("user_id", UUID.class),
                        rs.getString("student_id"),
                        rs.getString("full_name"),
                        rs.getString("email"),
                        rs.getBigDecimal("total_amount")
                ))
                .list();
    }

    private record VolunteerRecord(UUID userId, String studentId, String fullName, String email, BigDecimal verifiedHours) {}

    private List<VolunteerRecord> queryVolunteers(UUID campaignId) {
        return jdbc.sql("""
            select u.id as user_id, u.student_id, u.full_name, u.email,
                   coalesce(com.verified_hours, 0) as verified_hours
            from dut_connect.volunteer_registrations v
            join dut_connect.users u on u.id = v.user_id
            left join dut_connect.volunteer_completions com on com.campaign_id = v.campaign_id and com.user_id = v.user_id
            where v.campaign_id = :id and v.status = 'ACCEPTED'
            order by u.full_name
            """)
                .param("id", campaignId)
                .query((rs, n) -> new VolunteerRecord(
                        rs.getObject("user_id", UUID.class),
                        rs.getString("student_id"),
                        rs.getString("full_name"),
                        rs.getString("email"),
                        rs.getBigDecimal("verified_hours")
                ))
                .list();
    }

    private String generateCode(String prefix, UUID campaignId, UUID userId) {
        int hash = Math.abs(Objects.hash(campaignId, userId, 2026));
        return prefix + "-" + String.format("%04X", hash % 0xFFFF);
    }

    private String buildDonationEmailHtml(String studentName, String studentId, String campaignTitle, String amountFormatted, String customMessage) {
        return """
            <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06);">
              <!-- Top Banner -->
              <div style="background: linear-gradient(135deg, #0f2b5c 0%%, #1e3a8a 100%%); padding: 26px 30px; text-align: center; color: #ffffff;">
                <p style="margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #fbbf24; font-weight: bold;">Đại học Đà Nẵng · Trường Đại học Bách khoa</p>
                <h1 style="margin: 8px 0 0; font-size: 22px; font-weight: 800; color: #ffffff;">HỆ THỐNG DUT CONNECT</h1>
              </div>

              <!-- Main Content -->
              <div style="padding: 30px 32px; color: #1e293b; line-height: 1.6;">
                <p style="font-size: 16px; margin-top: 0;">Kính gửi bạn <strong>%s</strong> (MSSV: <strong>%s</strong>),</p>
                <p style="font-size: 15px;">Thay mặt Ban Tổ chức chiến dịch <strong>« %s »</strong> và Trường Đại học Bách khoa - Đại học Đà Nẵng, chúng tôi xin gửi lời cảm ơn chân thành và sâu sắc nhất đến bạn!</p>
                
                <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <p style="margin: 0; font-size: 14px; color: #166534;">
                    Đóng góp tài chính của bạn: <strong style="font-size: 17px; color: #15803d;">%s VNĐ</strong>
                  </p>
                </div>

                %s

                <p style="font-size: 15px;">Sự chung tay, sẻ chia và ủng hộ quý báu của bạn là nguồn động viên to lớn, giúp chiến dịch hoàn thành xuất sắc mục tiêu và lan tỏa những giá trị nhân văn cao đẹp đến cộng đồng.</p>

                <!-- Certificate Note -->
                <div style="margin: 25px 0; padding: 18px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center;">
                  <p style="margin: 0 0 10px; font-weight: bold; color: #0f2b5c; font-size: 15px;">🎖️ GIẤY CHỨNG NHẬN ĐÓNG GÓP CHÍNH THỨC</p>
                  <p style="margin: 0 0 12px; font-size: 13px; color: #64748b;">Nhà trường xin trân trọng trao tặng Giấy chứng nhận có chữ ký & con dấu của Trường Đại học Bách khoa (đính kèm tệp và hiển thị bên dưới):</p>
                  <img src="cid:certificateImage" alt="Giấy chứng nhận tham gia chiến dịch" style="max-width: 100%%; height: auto; border-radius: 6px; box-shadow: 0 3px 10px rgba(0,0,0,0.12);" />
                </div>

                <p style="font-size: 14px; color: #475569; margin-bottom: 0;">Chúc bạn luôn dồi dào sức khỏe, học tập tốt và tiếp tục đồng hành cùng phong trào sinh viên Bách khoa!</p>
              </div>

              <!-- Footer -->
              <div style="background: #f8fafc; padding: 18px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
                <p style="margin: 0;">Trường Đại học Bách khoa - Đại học Đà Nẵng · 54 Nguyễn Lương Bằng, Liên Chiểu, Đà Nẵng</p>
                <p style="margin: 4px 0 0;">DUT Connect · Nền tảng kết nối nguồn lực sinh viên và cộng đồng</p>
              </div>
            </div>
            """.formatted(
                escape(studentName),
                escape(studentId),
                escape(campaignTitle),
                amountFormatted,
                customMessage != null && !customMessage.isBlank() ? "<p style=\"font-size: 15px;\">" + escape(customMessage) + "</p>" : ""
        );
    }

    private String buildVolunteerEmailHtml(String studentName, String studentId, String campaignTitle, String hoursDetail, String customMessage) {
        return """
            <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06);">
              <!-- Top Banner -->
              <div style="background: linear-gradient(135deg, #0f2b5c 0%%, #1e3a8a 100%%); padding: 26px 30px; text-align: center; color: #ffffff;">
                <p style="margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; color: #fbbf24; font-weight: bold;">Đại học Đà Nẵng · Trường Đại học Bách khoa</p>
                <h1 style="margin: 8px 0 0; font-size: 22px; font-weight: 800; color: #ffffff;">HỆ THỐNG DUT CONNECT</h1>
              </div>

              <!-- Main Content -->
              <div style="padding: 30px 32px; color: #1e293b; line-height: 1.6;">
                <p style="font-size: 16px; margin-top: 0;">Kính gửi bạn <strong>%s</strong> (MSSV: <strong>%s</strong>),</p>
                <p style="font-size: 15px;">Thay mặt Ban Tổ chức chiến dịch <strong>« %s »</strong> và Trường Đại học Bách khoa - Đại học Đà Nẵng, chúng tôi trân trọng biểu dương và cảm ơn sự tham gia tích cực của bạn!</p>
                
                <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 18px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                  <p style="margin: 0; font-size: 14px; color: #166534;">
                    Ghi nhận cống hiến: <strong style="font-size: 17px; color: #15803d;">%s</strong>
                  </p>
                </div>

                %s

                <p style="font-size: 15px;">Sự nhiệt huyết, tinh thần xung kích và trách nhiệm cống hiến của bạn đã góp phần quan trọng vào thành công rực rỡ của chiến dịch, khẳng định bản lĩnh và nhiệt huyết của tuổi trẻ Bách khoa.</p>

                <!-- Certificate Note -->
                <div style="margin: 25px 0; padding: 18px; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center;">
                  <p style="margin: 0 0 10px; font-weight: bold; color: #0f2b5c; font-size: 15px;">🎖️ GIẤY CHỨNG NHẬN TÌNH NGUYỆN CHÍNH THỨC</p>
                  <p style="margin: 0 0 12px; font-size: 13px; color: #64748b;">Nhà trường xin trân trọng trao tặng Giấy chứng nhận có chữ ký & con dấu của Trường Đại học Bách khoa (đính kèm tệp và hiển thị bên dưới):</p>
                  <img src="cid:certificateImage" alt="Giấy chứng nhận tình nguyện chiến dịch" style="max-width: 100%%; height: auto; border-radius: 6px; box-shadow: 0 3px 10px rgba(0,0,0,0.12);" />
                </div>

                <p style="font-size: 14px; color: #475569; margin-bottom: 0;">Chúc bạn luôn giữ vững ngọn lửa nhiệt huyết, gặt hái nhiều thành công trong học tập và rèn luyện!</p>
              </div>

              <!-- Footer -->
              <div style="background: #f8fafc; padding: 18px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
                <p style="margin: 0;">Trường Đại học Bách khoa - Đại học Đà Nẵng · 54 Nguyễn Lương Bằng, Liên Chiểu, Đà Nẵng</p>
                <p style="margin: 4px 0 0;">DUT Connect · Nền tảng kết nối nguồn lực sinh viên và cộng đồng</p>
              </div>
            </div>
            """.formatted(
                escape(studentName),
                escape(studentId),
                escape(campaignTitle),
                hoursDetail,
                customMessage != null && !customMessage.isBlank() ? "<p style=\"font-size: 15px;\">" + escape(customMessage) + "</p>" : ""
        );
    }

    private static String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
