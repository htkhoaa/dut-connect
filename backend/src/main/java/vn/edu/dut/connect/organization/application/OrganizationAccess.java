package vn.edu.dut.connect.organization.application;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.identity.application.IdentityDirectoryPort;
import vn.edu.dut.connect.organization.domain.*;
@Service
@Transactional(readOnly=true)
public class OrganizationAccess implements OrganizationAccessPort {
    private final OrganizationRepository organizations;
    private final IdentityDirectoryPort identities;
    public OrganizationAccess(OrganizationRepository organizations, IdentityDirectoryPort identities) {
        this.organizations=organizations;
        this.identities=identities;
    }
    public boolean isVerified(UUID id) {
        return organizations.find(id).map(o->o.status()==OrganizationStatus.VERIFIED).orElse(false);
    }
    @Transactional
    public Snapshot lockMembership(UUID id, UUID user) {
        var organization = organizations.lock(id).orElseThrow(() -> vn.edu.dut.connect.shared.application.ApplicationFailure.missing("Organization not found"));
        var role = organizations.role(id, user);
        return new Snapshot(id, organization.name(), organization.status() == OrganizationStatus.VERIFIED,
                role.isPresent(), role.map(MemberRole::canRepresent).orElse(false));
    }
    public java.util.Map<UUID, String> names(java.util.Set<UUID> ids) {
        return organizations.names(ids);
    }
    public boolean canRepresent(UUID id, UUID user) {
        return identities.findAccount(user).filter(IdentityDirectoryPort.Account::active).isPresent()
        && isVerified(id) && organizations.role(id, user).map(MemberRole::canRepresent).orElse(false);
    }
}
