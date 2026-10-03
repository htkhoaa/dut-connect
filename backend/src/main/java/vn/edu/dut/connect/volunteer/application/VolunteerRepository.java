package vn.edu.dut.connect.volunteer.application;
import java.util.*;
import vn.edu.dut.connect.volunteer.domain.VolunteerRegistration;
import vn.edu.dut.connect.shared.application.PageResult;
public interface VolunteerRepository {
    record Counts(long accepted,long technical,long logistics) {}
    Optional<VolunteerRegistration> find(UUID id);
    Optional<UUID> campaignOf(UUID id);
    Optional<VolunteerRegistration> lock(UUID id);
    boolean exists(UUID campaignId,UUID userId);
    VolunteerRegistration save(VolunteerRegistration registration);
    PageResult<VolunteerRegistration> list(UUID campaignId,UUID userId,VolunteerQuery query);
    Counts counts(UUID campaignId);
}
