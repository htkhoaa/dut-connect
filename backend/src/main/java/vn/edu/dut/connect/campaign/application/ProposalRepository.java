package vn.edu.dut.connect.campaign.application;

import java.time.*;
import java.util.*;
import vn.edu.dut.connect.campaign.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;

public interface ProposalRepository {
    Optional<Proposal> find(UUID id);
    Optional<Proposal> lock(UUID id);
    Proposal save(Proposal proposal);
    PageResult<Proposal> list(CampaignQuery query, UUID proposer, ProposalStatus status);
}
