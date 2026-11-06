package vn.edu.dut.connect.notification.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications", schema = "dut_connect")
public class Notification {
    @Id
    private UUID id;
    @Column(nullable = false)
    private UUID userId;
    @Column(nullable = false, length = 50)
    private String type;
    @Column(nullable = false, length = 200)
    private String title;
    @Column(columnDefinition = "TEXT")
    private String body;
    @Column(length = 50)
    private String entityType;
    private UUID entityId;
    @Column(nullable = false)
    private boolean isRead;
    @Column(nullable = false)
    private Instant createdAt;

    protected Notification() {}

    public Notification(UUID userId, String type, String title, String body, String entityType, UUID entityId) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.body = body;
        this.entityType = entityType;
        this.entityId = entityId;
        this.isRead = false;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public String getType() { return type; }
    public String getTitle() { return title; }
    public String getBody() { return body; }
    public String getEntityType() { return entityType; }
    public UUID getEntityId() { return entityId; }
    public boolean isRead() { return isRead; }
    public Instant getCreatedAt() { return createdAt; }

    public void markRead() {
        this.isRead = true;
    }
}
