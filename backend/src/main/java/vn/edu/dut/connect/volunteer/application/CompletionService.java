package vn.edu.dut.connect.volunteer.application;

import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.volunteer.domain.*;
import vn.edu.dut.connect.shared.application.*;
import vn.edu.dut.connect.identity.application.Pagination;

import static vn.edu.dut.connect.volunteer.application.CoordinationContracts.*;

import vn.edu.dut.connect.identity.application.IdentityDirectoryPort;
import vn.edu.dut.connect.campaign.application.CampaignAccessPort;

@Service
@Transactional(readOnly = true)
public class CompletionService {
    private final CompletionRepository repository;
    private final AcceptedVolunteerRepository volunteers;
    private final AttendanceRepository attendance;
    private final CoordinationAuthorization access;
    private final IdentityDirectoryPort identities;
    private final CampaignAccessPort campaigns;

    public CompletionService(CompletionRepository repository, AcceptedVolunteerRepository volunteers, AttendanceRepository attendance, CoordinationAuthorization access, IdentityDirectoryPort identities, CampaignAccessPort campaigns) {
        this.repository = repository;
        this.volunteers = volunteers;
        this.attendance = attendance;
        this.access = access;
        this.identities = identities;
        this.campaigns = campaigns;
    }

    public PageResult<CompletionDto> list(UUID c, UUID actor, Pagination p) {
        access.requireManager(c, actor);
        return views(volunteers.acceptedPage(c, null, p));
    }

    @Transactional
    public CompletionDto record(UUID c, UUID user, UUID actor, CompletionRequest r) {
        access.requireCompletionWrite(c, actor);
        access.accepted(c, List.of(user));
        var existing = repository.completion(c, user);
        if (existing.isEmpty() && r.version() != null)
            throw new ApplicationFailure(409, "OPTIMISTIC_LOCK_CONFLICT", "Completion has not been created; reload");
        var v = existing.orElseGet(() -> new VolunteerCompletion(c, user));
        if (existing.isPresent()) v.requireVersion(r.version());
        v.record(r.status(), r.verifiedHours(), r.note(), actor);
        repository.saveCompletion(v);
        org.slf4j.LoggerFactory.getLogger(CompletionService.class).info("Completion recorded actor={} campaign={} volunteer={} status={}", actor, c, user, v.status());
        return completionDto(v, user, identities.findAccount(user).orElseThrow(), volunteers.accepted(c, Set.of(user)).get(user), attendance.presentCounts(c, Set.of(user)).getOrDefault(user, 0L), attendance.sessionCount(c));
    }

    public PageResult<HistoryDto> history(UUID actor, Pagination p) {
        var page = volunteers.acceptedPage(null, actor, p);
        var views = views(page);
        var campaignViews = campaigns.getCampaigns(page.items().stream().map(VolunteerRegistration::campaignId).collect(java.util.stream.Collectors.toSet()));
        return views.map(v -> {
            var c = campaignViews.get(v.campaignId());
            return new HistoryDto(c.id(), c.title(), c.slug(), v.assignedTrack(), v.status(), v.status() == CompletionStatus.VERIFIED ? v.verifiedHours() : null, v.verifiedAt(), v.note(), v.presentSessions(), v.totalSessions());
        });
    }

    private PageResult<CompletionDto> views(PageResult<VolunteerRegistration> page) {
        var users = page.items().stream().map(VolunteerRegistration::userId).collect(java.util.stream.Collectors.toSet());
        var campaignIds = page.items().stream().map(VolunteerRegistration::campaignId).collect(java.util.stream.Collectors.toSet());
        var names = identities.findAccounts(users);
        var completions = new HashMap<String, VolunteerCompletion>();
        for (var v : repository.completionBatch(campaignIds, users))
            completions.put(v.campaignId() + ":" + v.userId(), v);
        var counts = new HashMap<String, AttendanceRepository.AttendanceCounts>();
        for (var v : attendance.attendanceCounts(campaignIds, users)) counts.put(v.campaignId() + ":" + v.userId(), v);
        return page.map(v -> {
            String key = v.campaignId() + ":" + v.userId();
            var count = counts.get(key);
            return completionDto(completions.get(key), v.userId(), names.get(v.userId()), v.assignedTrack(), count == null ? 0 : count.presentSessions(), count == null ? 0 : count.totalSessions(), v.campaignId());
        });
    }

    private CompletionDto completionDto(VolunteerCompletion v, UUID user, IdentityDirectoryPort.Account a, VolunteerTrack track, long present, long total) {
        return completionDto(v, user, a, track, present, total, v.campaignId());
    }

    private CompletionDto completionDto(VolunteerCompletion v, UUID user, IdentityDirectoryPort.Account a, VolunteerTrack track, long present, long total, UUID c) {
        return new CompletionDto(v == null ? null : v.id(), c, user, a.fullName(), a.studentId(), track, v == null ? CompletionStatus.PENDING : v.status(), v == null || v.verifiedHours() == null ? null : v.verifiedHours().toPlainString(), v == null ? null : v.note(), v == null ? null : v.verifiedByUserId(), v == null ? null : v.verifiedAt(), v == null ? null : v.createdAt(), v == null ? null : v.updatedAt(), v == null ? null : v.version(), present, total);
    }
}
