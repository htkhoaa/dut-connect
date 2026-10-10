package vn.edu.dut.connect.volunteer.application;

import java.util.*;

import vn.edu.dut.connect.volunteer.domain.*;

public interface CompletionRepository {
    List<VolunteerCompletion> completionBatch(Set<UUID> campaigns, Set<UUID> users);

    Optional<VolunteerCompletion> completion(UUID campaign, UUID user);

    VolunteerCompletion saveCompletion(VolunteerCompletion value);

    Map<UUID, VolunteerCompletion> completions(UUID campaign, Set<UUID> users);
}
