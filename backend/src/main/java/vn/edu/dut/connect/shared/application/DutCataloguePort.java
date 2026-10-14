package vn.edu.dut.connect.shared.application;

import java.util.Optional;
import java.util.UUID;

/** Import bookkeeping and scalar lookups; domain writes use existing application services. */
public interface DutCataloguePort {
    void lockImport();
    Optional<UUID> administrator();
    Optional<UUID> imported(String key);
    Optional<UUID> organizationNamed(String name);
    UUID organizationType(String code);
    UUID category(String slug);
    void recordOrganization(String key, UUID id);
    void recordCampaign(String key, UUID id);
}
