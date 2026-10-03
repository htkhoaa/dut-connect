package vn.edu.dut.connect.organization.application;
import java.util.UUID;
/** The campaign module can use these checks without accessing organization repositories. */
public interface OrganizationAccessPort {
    record Snapshot(UUID id, String name, boolean verified, boolean member, boolean representative) {}
    Snapshot lockMembership(UUID organizationId, UUID userId);
    java.util.Map<UUID, String> names(java.util.Set<UUID> organizationIds);
    boolean isVerified(UUID organizationId);
    boolean canRepresent(UUID organizationId, UUID userId);
}
