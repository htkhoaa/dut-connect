package vn.edu.dut.connect.shared.infrastructure.catalog;

import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;

/** Explicit, local-only browse exclusions. Records and their audit/payment history are retained. */
@Component
public class DemoCatalogVisibility {
    private final Set<UUID> campaigns;
    private final Set<UUID> proposals;
    private final Set<UUID> organizations;
    private final Set<UUID> categories;

    public DemoCatalogVisibility(Environment environment,
            @Value("${app.demo-catalog.hidden-campaign-ids:}") String campaigns,
            @Value("${app.demo-catalog.hidden-proposal-ids:}") String proposals,
            @Value("${app.demo-catalog.hidden-organization-ids:}") String organizations,
            @Value("${app.demo-catalog.hidden-category-ids:}") String categories) {
        boolean local = environment.acceptsProfiles(Profiles.of("dev & !prod"));
        this.campaigns = local ? parse(campaigns) : Set.of();
        this.proposals = local ? parse(proposals) : Set.of();
        this.organizations = local ? parse(organizations) : Set.of();
        this.categories = local ? parse(categories) : Set.of();
    }

    private static Set<UUID> parse(String values) {
        return Arrays.stream(values.split(",")).map(String::trim).filter(value -> !value.isEmpty())
                .map(UUID::fromString).collect(Collectors.toUnmodifiableSet());
    }

    public Set<UUID> campaigns() {return campaigns;}
    public Set<UUID> proposals() {return proposals;}
    public Set<UUID> organizations() {return organizations;}
    public Set<UUID> categories() {return categories;}
}
