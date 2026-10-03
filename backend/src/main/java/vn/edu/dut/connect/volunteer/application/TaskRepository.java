package vn.edu.dut.connect.volunteer.application;

import java.util.*;

import vn.edu.dut.connect.volunteer.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
import vn.edu.dut.connect.identity.application.Pagination;

public interface TaskRepository {
    Optional<VolunteerTask> task(UUID id);

    Optional<UUID> taskCampaign(UUID id);

    VolunteerTask saveTask(VolunteerTask value);

    void deleteTask(UUID id);

    PageResult<VolunteerTask> tasks(UUID campaign, UUID assignee, TaskStatus status, Pagination page);

    Map<UUID, List<UUID>> assignees(Set<UUID> taskIds);

    void assign(UUID taskId, List<UUID> users);
}
