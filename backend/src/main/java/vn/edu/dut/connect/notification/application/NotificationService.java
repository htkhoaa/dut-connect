package vn.edu.dut.connect.notification.application;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.notification.domain.Notification;
import vn.edu.dut.connect.notification.infrastructure.persistence.NotificationRepository;
import vn.edu.dut.connect.notification.infrastructure.websocket.NotificationWebSocketHandler;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);
    private final NotificationRepository repository;
    private final NotificationWebSocketHandler wsHandler;

    public NotificationService(NotificationRepository repository, NotificationWebSocketHandler wsHandler) {
        this.repository = repository;
        this.wsHandler = wsHandler;
    }

    public record NotificationDto(
            UUID id,
            UUID userId,
            String type,
            String title,
            String body,
            String entityType,
            UUID entityId,
            boolean isRead,
            Instant createdAt
    ) {
        public static NotificationDto from(Notification n) {
            return new NotificationDto(
                    n.getId(), n.getUserId(), n.getType(), n.getTitle(), n.getBody(),
                    n.getEntityType(), n.getEntityId(), n.isRead(), n.getCreatedAt()
            );
        }
    }

    @Transactional
    public NotificationDto notifyUser(UUID userId, String type, String title, String body, String entityType, UUID entityId) {
        Notification notification = new Notification(userId, type, title, body, entityType, entityId);
        notification = repository.save(notification);
        NotificationDto dto = NotificationDto.from(notification);

        // Send via WebSocket realtime
        wsHandler.sendToUser(userId, Map.of(
                "action", "NEW_NOTIFICATION",
                "notification", dto
        ));

        log.info("Notification sent user={} type={} title={}", userId, type, title);
        return dto;
    }

    public void broadcastActivity(UUID campaignId, String type, String text) {
        wsHandler.broadcast(Map.of(
                "action", "CAMPAIGN_ACTIVITY",
                "campaignId", campaignId,
                "type", type,
                "text", text,
                "timestamp", Instant.now().toString()
        ));
    }

    public long getUnreadCount(UUID userId) {
        return repository.countUnreadByUserId(userId);
    }

    public Page<NotificationDto> getNotifications(UUID userId, int page, int size) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .map(NotificationDto::from);
    }

    @Transactional
    public boolean markRead(UUID id, UUID userId) {
        return repository.findByIdAndUserId(id, userId).map(n -> {
            n.markRead();
            repository.save(n);
            return true;
        }).orElse(false);
    }

    @Transactional
    public int markAllRead(UUID userId) {
        return repository.markAllAsRead(userId);
    }
}
