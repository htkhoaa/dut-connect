package vn.edu.dut.connect.identity.application;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

public interface ProfileMatchingPort {
    /** Private terms are used only for redaction; they must never enter provider payloads. */
    record Profile(String experience, List<String> skills, boolean active, long version, List<String> privateTerms) {}
    Map<UUID, Profile> profiles(Set<UUID> userIds);
}
