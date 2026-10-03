package vn.edu.dut.connect.volunteer.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

import static vn.edu.dut.connect.volunteer.domain.CoordinationValues.*;

@Entity
@Table(name = "meetings")
public class Meeting {
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
    @Column(columnDefinition = "text")
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MeetingType meetingType;
    @Column(nullable = false)
    private Instant startsAt;
    @Column(nullable = false)
    private Instant endsAt;
    @Column(length = 300)
    private String location;
    @Column(length = 1000)
    private String meetingUrl;
    @Column(nullable = false)
    private UUID createdByUserId;

    protected Meeting() {
    }

    public Meeting(UUID campaign, UUID actor, String title, String description, MeetingType type, Instant start, Instant end, String location, String url) {
        identifier(campaign, "campaignId");
        identifier(actor, "createdByUserId");
        id = UUID.randomUUID();
        campaignId = campaign;
        createdByUserId = actor;
        createdAt = Instant.now();
        edit(title, description, type, start, end, location, url);
    }

    public void edit(String title, String description, MeetingType type, Instant start, Instant end, String location, String url) {
        String t = text(title, "title", 200, true), d = text(description, "description", 10000, false), l = text(location, "location", 300, false), u = text(url, "meetingUrl", 1000, false);
        period(start, end);
        if (type == null) invalid("meetingType", "Choose a meeting type");
        if (type == MeetingType.ONLINE && u == null) invalid("meetingUrl", "Online meeting requires a URL");
        if (u != null) {
            try {
                var uri = java.net.URI.create(u);
                if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) || uri.getHost() == null || uri.getUserInfo() != null)
                    invalid("meetingUrl", "Use a complete HTTP(S) URL");
            } catch (IllegalArgumentException e) {
                invalid("meetingUrl", "Use a complete HTTP(S) URL");
            }
        }
        if (type == MeetingType.OFFLINE && l == null) invalid("location", "Offline meeting requires a location");
        this.title = t;
        this.description = d;
        meetingType = type;
        startsAt = start;
        endsAt = end;
        this.location = l;
        meetingUrl = u;
        touch();
    }

    public String title() {
        return title;
    }

    public String description() {
        return description;
    }

    public MeetingType meetingType() {
        return meetingType;
    }

    public Instant startsAt() {
        return startsAt;
    }

    public Instant endsAt() {
        return endsAt;
    }

    public String location() {
        return location;
    }

    public String meetingUrl() {
        return meetingUrl;
    }

    public UUID createdByUserId() {
        return createdByUserId;
    }
}
