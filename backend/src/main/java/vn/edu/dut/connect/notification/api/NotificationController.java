package vn.edu.dut.connect.notification.api;

import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.notification.application.NotificationService;
import vn.edu.dut.connect.notification.application.NotificationService.NotificationDto;
import vn.edu.dut.connect.shared.api.CurrentActor;

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
        UUID userId = CurrentActor.id(auth);
        return service.getNotifications(userId, page, size);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(Authentication auth) {
        UUID userId = CurrentActor.id(auth);
        return Map.of("count", service.getUnreadCount(userId));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(Authentication auth, @PathVariable UUID id) {
        UUID userId = CurrentActor.id(auth);
        boolean updated = service.markRead(id, userId);
        return updated ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/read-all")
    public Map<String, Integer> markAllRead(Authentication auth) {
        UUID userId = CurrentActor.id(auth);
        int updated = service.markAllRead(userId);
        return Map.of("updated", updated);
    }
}
