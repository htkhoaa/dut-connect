package vn.edu.dut.connect.notification.api;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.notification.application.NotificationService;
import vn.edu.dut.connect.notification.application.NotificationService.NotificationDto;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public Page<NotificationDto> list(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        UUID userId = UUID.fromString(auth.getName());
        return service.getNotifications(userId, page, size);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        return Map.of("count", service.getUnreadCount(userId));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(Authentication auth, @PathVariable UUID id) {
        UUID userId = UUID.fromString(auth.getName());
        boolean updated = service.markRead(id, userId);
        return updated ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/read-all")
    public Map<String, Integer> markAllRead(Authentication auth) {
        UUID userId = UUID.fromString(auth.getName());
        int updated = service.markAllRead(userId);
        return Map.of("updated", updated);
    }
}
