package vn.edu.dut.connect.volunteer.application;

import static vn.edu.dut.connect.volunteer.application.CoordinationContracts.*;

import java.util.*;
import vn.edu.dut.connect.identity.application.Pagination;
import vn.edu.dut.connect.shared.application.PageResult;
import vn.edu.dut.connect.volunteer.domain.*;

public interface AttendanceRepository {
    record AttendanceCounts(
        UUID campaignId,
        UUID userId,
        long presentSessions,
        long totalSessions
    ) {}

    List<AttendanceCounts> attendanceCounts(Set<UUID> campaigns, Set<UUID> users);

    Optional<AttendanceSession> session(UUID id);

    Optional<AttendanceSession> sessionByQrToken(String token);

    Optional<UUID> sessionCampaign(UUID id);

    AttendanceSession saveSession(AttendanceSession value);

    void deleteSession(UUID id);

    PageResult<AttendanceSession> sessions(UUID campaign, Pagination page);

    PageResult<AttendanceRow> records(UUID session, Pagination page);

    List<AttendanceRow> upsert(UUID session, UUID actor, List<AttendanceInput> records);

    Map<UUID, Long> presentCounts(UUID campaign, Set<UUID> users);

    long sessionCount(UUID campaign);
}
