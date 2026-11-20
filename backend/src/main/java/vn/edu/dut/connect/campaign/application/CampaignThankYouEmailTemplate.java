package vn.edu.dut.connect.campaign.application;

/** HTML rendering only; authorization and delivery stay in CampaignThankYouService. */
public final class CampaignThankYouEmailTemplate {

    private CampaignThankYouEmailTemplate() {}

    public static String buildDonationEmailHtml(
        String studentName,
        String studentId,
        String campaignTitle,
        String amountFormatted,
        String customMessage
    ) {
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
            customMessage != null && !customMessage.isBlank()
                ? "<p style=\"font-size: 15px;\">" + escape(customMessage) + "</p>"
                : ""
        );
    }

    public static String buildVolunteerEmailHtml(
        String studentName,
        String studentId,
        String campaignTitle,
        String hoursDetail,
        String customMessage
    ) {
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
            customMessage != null && !customMessage.isBlank()
                ? "<p style=\"font-size: 15px;\">" + escape(customMessage) + "</p>"
                : ""
        );
    }

    private static String escape(String value) {
        if (value == null) return "";
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;");
    }
}
