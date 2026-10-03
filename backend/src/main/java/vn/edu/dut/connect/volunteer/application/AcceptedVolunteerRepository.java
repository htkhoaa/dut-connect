package vn.edu.dut.connect.volunteer.application;

import java.util.*;

import vn.edu.dut.connect.volunteer.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
import vn.edu.dut.connect.identity.application.Pagination;

public interface AcceptedVolunteerRepository {
    record Participation(UUID campaignId, UUID userId, VolunteerTrack assignedTrack) {
    }

    List<Participation> participations(Set<UUID> campaigns, Set<UUID> users);

    Map<UUID, VolunteerTrack> accepted(UUID campaign, Set<UUID> users);

    PageResult<VolunteerRegistration> acceptedPage(UUID campaign, UUID user, Pagination page);
}
