package vn.edu.dut.connect.volunteer.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

import static vn.edu.dut.connect.volunteer.domain.CoordinationValues.*;

@Entity
@Table(name = "attendance_sessions")
public class AttendanceSession {
    @Id
    private UUID id;
    @Column(nullable = false)
    private UUID campaignId;
    @Column(nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;
    @Version
    private Long version;

    public UUID id() {
        return id;
    }

    public UUID campaignId() {
        return campaignId;
    }

    public Instant createdAt() {
        return createdAt;
    }

    public Instant updatedAt() {
        return updatedAt;
    }

    public Long version() {
        return version;
    }

    public void requireVersion(Long expected) {
        CoordinationValues.version(version, expected);
    }

    public void touch() {
        updatedAt = Instant.now();
    }

    @Column(nullable = false, length = 200)
    private String title;
    @Column(nullable = false)
    private Instant startsAt;
    @Column(nullable = false)
    private Instant endsAt;
    @Column(nullable = false)
    private UUID createdByUserId;

    protected AttendanceSession() {
    }

    public AttendanceSession(UUID campaign, UUID actor, String title, Instant start, Instant end) {
        identifier(campaign, "campaignId");
        identifier(actor, "createdByUserId");
        id = UUID.randomUUID();
        campaignId = campaign;
        createdByUserId = actor;
        createdAt = Instant.now();
        edit(title, start, end);
    }

    public void edit(String title, Instant start, Instant end) {
        String t = text(title, "title", 200, true);
        period(start, end);
        this.title = t;
        startsAt = start;
        endsAt = end;
        touch();
    }

    public String title() {
        return title;
    }

    public Instant startsAt() {
        return startsAt;
    }

    public Instant endsAt() {
        return endsAt;
    }

    public UUID createdByUserId() {
        return createdByUserId;
    }
}
