package vn.edu.dut.connect.shared.application;

import java.nio.charset.StandardCharsets;
import java.util.Optional;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailNotificationService {
    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);
    private final Optional<JavaMailSender> sender;
    private final boolean enabled;
    private final String from;

    public EmailNotificationService(ObjectProvider<JavaMailSender> sender,
                                    @Value("${app.mail.enabled:false}") boolean enabled,
                                    @Value("${app.mail.from}") String from) {
        this.sender = Optional.ofNullable(sender.getIfAvailable());
        this.enabled = enabled;
        this.from = from;
    }

    public void loginLink(String email, String link) {
        send(email, "Đăng nhập DUT Connect", "<p>Nhấn vào liên kết sau để đăng nhập DUT Connect:</p><p><a href=\"" +
                escape(link) + "\">Đăng nhập an toàn</a></p><p>Liên kết có hiệu lực trong 15 phút và chỉ dùng một lần.</p>", null);
    }

    public void participationAccepted(String email, String name, String campaign) {
        send(email, "Bạn đã được chấp nhận tham gia chiến dịch", "<p>Chào " + escape(name) + ",</p><p>Bạn đã được chấp nhận tham gia chiến dịch <strong>" +
                escape(campaign) + "</strong> trên DUT Connect.</p>", null);
    }

    public void completionCertificate(String email, String name, String campaign, String hours) {
        String title = "Chứng nhận tham gia - " + campaign;
        String body = "<h1>Chứng nhận tham gia</h1><p>Xác nhận " + escape(name) + " đã hoàn thành chiến dịch <strong>" +
                escape(campaign) + "</strong>.</p><p>Số giờ được xác minh: <strong>" + escape(hours) + "</strong></p><p>DUT Connect</p>";
        send(email, title, body, new Attachment("certificate.html", body));
    }

    public void sendWithImageAttachment(String recipient, String subject, String html, String attachmentName, byte[] imageBytes, String contentType) {
        if (!enabled) {
            log.info("Email notification skipped because APP_MAIL_ENABLED=false recipient={} subject={}", recipient, subject);
            return;
        }
        JavaMailSender mail = sender.orElseThrow(() -> new IllegalStateException("Email is enabled but SMTP is not configured"));
        try {
            var message = mail.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(html, true);
            if (imageBytes != null && imageBytes.length > 0) {
                var resource = new ByteArrayResource(imageBytes);
                helper.addAttachment(attachmentName, resource, contentType != null ? contentType : "image/png");
                try {
                    helper.addInline("certificateImage", resource, contentType != null ? contentType : "image/png");
                } catch (Exception ignored) {}
            }
            mail.send(message);
        } catch (Exception ex) {
            log.error("Email notification failed recipient={} subject={} error={}", recipient, subject, ex.getClass().getSimpleName());
            throw new IllegalStateException("Email notification could not be sent", ex);
        }
    }

    private void send(String recipient, String subject, String html, Attachment attachment) {
        if (!enabled) {
            log.info("Email notification skipped because APP_MAIL_ENABLED=false recipient={} subject={}", recipient, subject);
            return;
        }
        JavaMailSender mail = sender.orElseThrow(() -> new IllegalStateException("Email is enabled but SMTP is not configured"));
        try {
            var message = mail.createMimeMessage();
            var helper = new MimeMessageHelper(message, attachment != null, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(recipient);
            helper.setSubject(subject);
            helper.setText(html, true);
            if (attachment != null) helper.addAttachment(attachment.name(), new ByteArrayResource(attachment.content().getBytes(StandardCharsets.UTF_8)));
            mail.send(message);
        } catch (Exception ex) {
            log.error("Email notification failed recipient={} subject={} error={}", recipient, subject, ex.getClass().getSimpleName());
            throw new IllegalStateException("Email notification could not be sent", ex);
        }
    }

    private static String escape(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    private record Attachment(String name, String content) {}
}
