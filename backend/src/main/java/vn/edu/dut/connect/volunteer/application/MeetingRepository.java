package vn.edu.dut.connect.volunteer.application;

import java.util.*;

import vn.edu.dut.connect.volunteer.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
import vn.edu.dut.connect.identity.application.Pagination;

public interface MeetingRepository {
    Optional<Meeting> meeting(UUID id);

    Optional<UUID> meetingCampaign(UUID id);

    Meeting saveMeeting(Meeting value);

    void deleteMeeting(UUID id);

    PageResult<Meeting> meetings(UUID campaign, Pagination page);
}
