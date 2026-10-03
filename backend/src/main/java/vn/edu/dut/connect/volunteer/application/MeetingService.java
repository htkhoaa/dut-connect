package vn.edu.dut.connect.volunteer.application;

import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.volunteer.domain.*;
import vn.edu.dut.connect.shared.application.*;
import vn.edu.dut.connect.identity.application.Pagination;

import static vn.edu.dut.connect.volunteer.application.CoordinationContracts.*;

@Service
@Transactional(readOnly = true)
public class MeetingService {
    private final MeetingRepository repository;
    private final CoordinationAuthorization access;

    public MeetingService(MeetingRepository repository, CoordinationAuthorization access) {
        this.repository = repository;
        this.access = access;
    }

    public PageResult<MeetingDto> list(UUID campaign, UUID actor, Pagination p) {
        boolean manager = access.view(campaign, actor) && access.operational(campaign);
        return repository.meetings(campaign, p).map(v -> dto(v, manager));
    }

    @Transactional
    public MeetingDto create(UUID c, UUID actor, MeetingRequest r) {
        access.requireOperationalWrite(c, actor);
        access.requireManager(c, actor);
        CoordinationPatch.clear(r.clearFields(), Set.of());
        return dto(repository.saveMeeting(new Meeting(c, actor, r.title(), r.description(), r.meetingType(), r.startsAt(), r.endsAt(), r.location(), r.meetingUrl())), true);
    }

    @Transactional
    public MeetingDto edit(UUID id, UUID actor, MeetingRequest r) {
        UUID c = repository.meetingCampaign(id).orElseThrow(() -> ApplicationFailure.missing("Meeting not found"));
        access.requireOperationalWrite(c, actor);
        access.requireManager(c, actor);
        var v = repository.meeting(id).orElseThrow(() -> ApplicationFailure.missing("Meeting not found"));
        v.requireVersion(r.version());
        CoordinationPatch.clear(r.clearFields(), Set.of("description", "location", "meetingUrl"));
        v.edit(r.title() == null ? v.title() : r.title(), CoordinationPatch.text(r.description(), v.description(), "description", r.clearFields()), r.meetingType() == null ? v.meetingType() : r.meetingType(), r.startsAt() == null ? v.startsAt() : r.startsAt(), r.endsAt() == null ? v.endsAt() : r.endsAt(), CoordinationPatch.text(r.location(), v.location(), "location", r.clearFields()), CoordinationPatch.text(r.meetingUrl(), v.meetingUrl(), "meetingUrl", r.clearFields()));
        return dto(repository.saveMeeting(v), true);
    }

    @Transactional
    public void delete(UUID id, UUID actor, Long version) {
        UUID c = repository.meetingCampaign(id).orElseThrow(() -> ApplicationFailure.missing("Meeting not found"));
        access.requireOperationalWrite(c, actor);
        access.requireManager(c, actor);
        var v = repository.meeting(id).orElseThrow(() -> ApplicationFailure.missing("Meeting not found"));
        v.requireVersion(version);
        repository.deleteMeeting(id);
    }

    private MeetingDto dto(Meeting v, boolean manager) {
        return new MeetingDto(v.id(), v.campaignId(), v.title(), v.description(), v.meetingType(), v.startsAt(), v.endsAt(), v.location(), v.meetingUrl(), v.createdByUserId(), v.createdAt(), v.updatedAt(), v.version(), manager);
    }
}
