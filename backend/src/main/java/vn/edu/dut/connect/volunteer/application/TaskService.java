package vn.edu.dut.connect.volunteer.application;

import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.volunteer.domain.*;
import vn.edu.dut.connect.shared.application.*;
import vn.edu.dut.connect.identity.application.Pagination;

import static vn.edu.dut.connect.volunteer.application.CoordinationContracts.*;

import vn.edu.dut.connect.campaign.application.CampaignAccessPort;
import vn.edu.dut.connect.campaign.domain.CampaignStatus;
import vn.edu.dut.connect.identity.application.IdentityDirectoryPort;

@Service
@Transactional(readOnly = true)
public class TaskService {
    private static final org.slf4j.Logger log=org.slf4j.LoggerFactory.getLogger(TaskService.class);
    private final AcceptedVolunteerRepository volunteers;
    private final TaskRepository repository;
    private final CoordinationAuthorization access;
    private final CampaignAccessPort campaigns;
    private final IdentityDirectoryPort identities;

    public TaskService(AcceptedVolunteerRepository volunteers, TaskRepository repository, CoordinationAuthorization access, CampaignAccessPort campaigns, IdentityDirectoryPort identities) {
        this.volunteers = volunteers;
        this.repository = repository;
        this.access = access;
        this.campaigns = campaigns;
        this.identities = identities;
    }

    public PageResult<TaskDto> list(UUID c, UUID actor, TaskStatus status, Pagination p) {
        boolean manager = access.view(c, actor);
        return dtos(repository.tasks(c, manager ? null : actor, status, p), actor);
    }

    public PageResult<TaskDto> mine(UUID actor, TaskStatus status, Pagination p) {
        return dtos(repository.tasks(null, actor, status, p), actor);
    }

    public TaskDto detail(UUID id, UUID actor) {
        var v = repository.task(id).orElseThrow(() -> ApplicationFailure.missing("Task not found"));
        boolean manager = access.view(v.campaignId(), actor);
        if (!manager && !assigned(id, actor)) CoordinationAuthorization.denied();
        return dto(v, actor);
    }

    @Transactional
    public TaskDto create(UUID c, UUID actor, TaskRequest r) {
        access.requireOperationalWrite(c, actor);
        access.requireManager(c, actor);
        if (r.status() != null && r.status() != TaskStatus.TODO)
            CoordinationValues.invalid("status", "New tasks start To do");
        CoordinationPatch.clear(r.clearFields(), Set.of());
        var users = r.assigneeUserIds() == null ? List.<UUID>of() : r.assigneeUserIds();
        access.accepted(c, users);
        var v = repository.saveTask(new VolunteerTask(c, actor, r.title(), r.description(), r.track(), r.priority(), r.dueAt()));
        repository.assign(v.id(), users);
        return dto(v, actor);
    }

    @Transactional
    public TaskDto edit(UUID id, UUID actor, TaskRequest r) {
        var v = writable(id, actor);
        access.requireManager(v.campaignId(), actor);
        v.requireVersion(r.version());
        v.mutable();
        CoordinationPatch.clear(r.clearFields(), Set.of("dueAt"));
        if (r.clearFields() != null && r.clearFields().contains("dueAt") && r.dueAt() != null)
            CoordinationValues.invalid("dueAt", "Cannot set and clear due date");
        if (r.assigneeUserIds() != null) access.accepted(v.campaignId(), r.assigneeUserIds());
        v.edit(r.title() == null ? v.title() : r.title(), r.description() == null ? v.description() : r.description(), r.track() == null ? v.track() : r.track(), r.priority() == null ? v.priority() : r.priority(), r.clearFields() != null && r.clearFields().contains("dueAt") ? null : r.dueAt() == null ? v.dueAt() : r.dueAt());
        if (r.status() != null) v.correct(r.status());
        repository.saveTask(v);
        log.info("Task transitioned actor={} campaign={} task={} status={}",actor,v.campaignId(),v.id(),v.status());
        if (r.assigneeUserIds() != null) repository.assign(id, r.assigneeUserIds());
        return dto(v, actor);
    }

    @Transactional
    public TaskDto start(UUID id, UUID actor, Long version) {
        var v = writable(id, actor);
        if (!assigned(id, actor)) CoordinationAuthorization.denied();
        v.requireVersion(version);
        v.start();
        repository.saveTask(v);
        log.info("Task transitioned actor={} campaign={} task={} status={}",actor,v.campaignId(),v.id(),v.status());
        return dto(v, actor);
    }

    @Transactional
    public TaskDto done(UUID id, UUID actor, Long version) {
        var v = writable(id, actor);
        if (!assigned(id, actor)) CoordinationAuthorization.denied();
        v.requireVersion(version);
        v.done();
        repository.saveTask(v);
        log.info("Task transitioned actor={} campaign={} task={} status={}",actor,v.campaignId(),v.id(),v.status());
        return dto(v, actor);
    }

    @Transactional
    public TaskDto verify(UUID id, UUID actor, Long version) {
        var v = writable(id, actor);
        access.requireManager(v.campaignId(), actor);
        v.requireVersion(version);
        v.verify(actor);
        repository.saveTask(v);
        log.info("Task transitioned actor={} campaign={} task={} status={}",actor,v.campaignId(),v.id(),v.status());
        return dto(v, actor);
    }

    @Transactional
    public void delete(UUID id, UUID actor, Long version) {
        var v = writable(id, actor);
        access.requireManager(v.campaignId(), actor);
        v.requireVersion(version);
        v.mutable();
        repository.deleteTask(id);
    }

    private VolunteerTask writable(UUID id, UUID actor) {
        UUID c = repository.taskCampaign(id).orElseThrow(() -> ApplicationFailure.missing("Task not found"));
        access.requireOperationalWrite(c, actor);
        access.view(c, actor);
        return repository.task(id).orElseThrow(() -> ApplicationFailure.missing("Task not found"));
    }

    private boolean assigned(UUID id, UUID actor) {
        return repository.assignees(Set.of(id)).getOrDefault(id, List.of()).contains(actor);
    }

    private TaskDto dto(VolunteerTask v, UUID actor) {
        return dtos(new PageResult<>(List.of(v), 0, 1, 1, 1, false, false), actor).items().getFirst();
    }

    private PageResult<TaskDto> dtos(PageResult<VolunteerTask> page, UUID actor) {
        var assignment = repository.assignees(page.items().stream().map(VolunteerTask::id).collect(java.util.stream.Collectors.toSet()));
        var names = identities.findAccounts(assignment.values().stream().flatMap(List::stream).collect(java.util.stream.Collectors.toSet()));
        var campaignViews = campaigns.getCampaigns(page.items().stream().map(VolunteerTask::campaignId).collect(java.util.stream.Collectors.toSet()));
        var account = identities.findAccount(actor).orElseThrow();
        if (!account.active()) CoordinationAuthorization.denied();
        var managed = account.admin() ? campaignViews.keySet() : campaigns.managedCampaigns(campaignViews.keySet(), actor);
        var tracks = new HashMap<String, VolunteerTrack>();
        for (var p : volunteers.participations(campaignViews.keySet(), names.keySet()))
            tracks.put(p.campaignId() + ":" + p.userId(), p.assignedTrack());
        return page.map(v -> {
            var c = campaignViews.get(v.campaignId());
            boolean mutable = c.status() == CampaignStatus.OPEN || c.status() == CampaignStatus.ACTIVE;
            var users = assignment.getOrDefault(v.id(), List.of());
            return new TaskDto(v.id(), v.campaignId(), c.title(), v.title(), v.description(), v.track(), v.priority(), v.dueAt(), v.status(), users.stream().map(u -> {
                var a = names.get(u);
                return new AssigneeDto(u, a.fullName(), a.studentId(), tracks.get(v.campaignId() + ":" + u));
            }).toList(), v.createdByUserId(), v.verifiedByUserId(), v.verifiedAt(), v.createdAt(), v.updatedAt(), v.version(), mutable && managed.contains(v.campaignId()) && v.status() != TaskStatus.VERIFIED, mutable && users.contains(actor) && (v.status() == TaskStatus.TODO || v.status() == TaskStatus.IN_PROGRESS));
        });
    }
}
