package vn.edu.dut.connect.ai.application;

import java.util.List;

public interface AiService {
    record RequiredSkill(String name, String track, int importance) {}
    record Campaign(String title, String description, String volunteerRequirements, List<RequiredSkill> requiredSkills) {}
    record Candidate(String candidateRef, String preferredTrack, List<String> skills, String experience, String availability) {}
    record VolunteerMatchInput(Campaign campaign, Candidate candidate) {}
    enum Track { TECHNICAL, LOGISTICS }
    enum Confidence { LOW, MEDIUM, HIGH }
    record VolunteerMatchResult(int score, Track recommendedTrack, List<String> matchedSkills, List<String> missingSkills, String reason, Confidence confidence) {}
    VolunteerMatchResult evaluateVolunteer(VolunteerMatchInput input);
    void requireAvailable();
    String model();
    int maxApplicants();
}
