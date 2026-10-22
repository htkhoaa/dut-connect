package vn.edu.dut.connect.volunteer.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

import static vn.edu.dut.connect.volunteer.domain.CoordinationValues.*;

@Entity
@Table(name = "volunteer_tasks")
public class VolunteerTask {
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
    @Column(nullable = false, columnDefinition = "text")
    private String description;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VolunteerTrack track;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskPriority priority;
    private Instant dueAt;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status;
    @Column(nullable = false)
    private UUID createdByUserId;
    private UUID verifiedByUserId;
    private Instant verifiedAt;

    protected VolunteerTask() {
    }

    public VolunteerTask(UUID campaign, UUID actor, String title, String description, VolunteerTrack track, TaskPriority priority, Instant due) {
        identifier(campaign, "campaignId");
        identifier(actor, "createdByUserId");
        id = UUID.randomUUID();
        campaignId = campaign;
        createdByUserId = actor;
        createdAt = Instant.now();
        status = TaskStatus.TODO;
        edit(title, description, track, priority, due);
    }

    public void mutable() {
        if (status == TaskStatus.VERIFIED) state("Verified tasks are terminal");
    }

    public void edit(String title, String description, VolunteerTrack track, TaskPriority priority, Instant due) {
        mutable();
        String t = text(title, "title", 200, true), d = text(description, "description", 10000, true);
        if (track == null) invalid("track", "Choose a track");
        if (priority == null) invalid("priority", "Choose a priority");
        this.title = t;
        this.description = d;
        this.track = track;
        this.priority = priority;
        dueAt = due;
        touch();
    }

    public void start() {
        transition(TaskStatus.TODO, TaskStatus.IN_PROGRESS);
    }

    public void done() {
        transition(TaskStatus.IN_PROGRESS, TaskStatus.DONE);
    }

    public void verify(UUID actor) {
        if (actor == null) invalid("verifiedByUserId", "Verifier required");
        transition(TaskStatus.DONE, TaskStatus.VERIFIED);
        verifiedByUserId = actor;
        verifiedAt = Instant.now();
    }

    public void correct(TaskStatus next) {
        if (status == TaskStatus.IN_PROGRESS && next == TaskStatus.TODO || status == TaskStatus.DONE && next == TaskStatus.IN_PROGRESS) {
            status = next;
            touch();
        } else state("Only In progress to To do or Done to In progress corrections are allowed");
    }

    private void transition(TaskStatus from, TaskStatus to) {
        if (status != from) state("Task cannot perform this transition");
        status = to;
        touch();
    }

    public String title() {
        return title;
    }

    public String description() {
        return description;
    }

    public VolunteerTrack track() {
        return track;
    }

    public TaskPriority priority() {
        return priority;
    }

    public Instant dueAt() {
        return dueAt;
    }

    public TaskStatus status() {
        return status;
    }

    public UUID createdByUserId() {
        return createdByUserId;
    }

    public UUID verifiedByUserId() {
        return verifiedByUserId;
    }

    public Instant verifiedAt() {
        return verifiedAt;
    }
}
