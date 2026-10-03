package vn.edu.dut.connect.volunteer.application;

import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.volunteer.domain.*;
import vn.edu.dut.connect.shared.application.*;
import vn.edu.dut.connect.identity.application.Pagination;

import static vn.edu.dut.connect.volunteer.application.CoordinationContracts.*;

import vn.edu.dut.connect.identity.application.IdentityDirectoryPort;

@Service
@Transactional(readOnly = true)
public class AttendanceService {
    private final AttendanceRepository repository;
    private final CoordinationAuthorization access;
    private final IdentityDirectoryPort identities;

    public AttendanceService(AttendanceRepository repository, CoordinationAuthorization access, IdentityDirectoryPort identities) {
        this.repository = repository;
        this.access = access;
        this.identities = identities;
    }

    public PageResult<SessionDto> list(UUID c, UUID actor, Pagination p) {
        access.requireManager(c, actor);
        return repository.sessions(c, p).map(AttendanceService::dto);
    }

    @Transactional
    public SessionDto create(UUID c, UUID actor, SessionRequest r) {
        access.requireOperationalWrite(c, actor);
        access.requireManager(c, actor);
        return dto(repository.saveSession(new AttendanceSession(c, actor, r.title(), r.startsAt(), r.endsAt())));
    }

    @Transactional
    public SessionDto edit(UUID id, UUID actor, SessionRequest r) {
        var v = writable(id, actor);
        v.requireVersion(r.version());
        v.edit(r.title() == null ? v.title() : r.title(), r.startsAt() == null ? v.startsAt() : r.startsAt(), r.endsAt() == null ? v.endsAt() : r.endsAt());
        return dto(repository.saveSession(v));
    }

    @Transactional
    public void delete(UUID id, UUID actor, Long version) {
        var v = writable(id, actor);
        v.requireVersion(version);
        repository.deleteSession(id);
    }

    public PageResult<AttendanceDto> records(UUID id, UUID actor, Pagination p) {
        var c = repository.sessionCampaign(id).orElseThrow(() -> ApplicationFailure.missing("Session not found"));
        access.requireManager(c, actor);
        var page = repository.records(id, p);
        var mapped = recordDtos(page.items());
        var byId = mapped.stream().collect(java.util.stream.Collectors.toMap(AttendanceDto::id, v -> v));
        return page.map(v -> byId.get(v.id()));
    }

    @Transactional
    public AttendanceResult record(UUID id, UUID actor, AttendanceRequest r) {
        var v = writable(id, actor);
        v.requireVersion(r.version());
        access.accepted(v.campaignId(), r.records().stream().map(AttendanceInput::userId).toList());
        var rows = repository.upsert(id, actor, r.records());
        v.touch();
        repository.saveSession(v);
        return new AttendanceResult(dto(v), recordDtos(rows));
    }

    private AttendanceSession writable(UUID id, UUID actor) {
        UUID c = repository.sessionCampaign(id).orElseThrow(() -> ApplicationFailure.missing("Session not found"));
        access.requireOperationalWrite(c, actor);
        access.requireManager(c, actor);
        return repository.session(id).orElseThrow(() -> ApplicationFailure.missing("Session not found"));
    }

    private List<AttendanceDto> recordDtos(List<AttendanceRow> rows) {
        var names = identities.findAccounts(rows.stream().map(AttendanceRow::userId).collect(java.util.stream.Collectors.toSet()));
        return rows.stream().map(v -> {
            var a = names.get(v.userId());
            return new AttendanceDto(v.id(), v.sessionId(), v.userId(), a.fullName(), a.studentId(), v.status(), v.recordedByUserId(), v.recordedAt(), v.updatedAt());
        }).toList();
    }

    static SessionDto dto(AttendanceSession v) {
        return new SessionDto(v.id(), v.campaignId(), v.title(), v.startsAt(), v.endsAt(), v.createdByUserId(), v.createdAt(), v.updatedAt(), v.version());
    }
}
