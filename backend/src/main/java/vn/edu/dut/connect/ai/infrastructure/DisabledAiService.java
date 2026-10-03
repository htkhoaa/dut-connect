package vn.edu.dut.connect.ai.infrastructure;

import vn.edu.dut.connect.ai.application.AiService;

public class DisabledAiService implements AiService {
    private final AiSettings settings;
    public DisabledAiService(AiSettings settings) { this.settings = settings; }
    public VolunteerMatchResult evaluateVolunteer(VolunteerMatchInput input) { throw AiSettings.unavailable(); }
    public void requireAvailable() { throw AiSettings.unavailable(); }
    public String model() { return settings.model(); }
    public int maxApplicants() { return settings.maxApplicants(); }
}
