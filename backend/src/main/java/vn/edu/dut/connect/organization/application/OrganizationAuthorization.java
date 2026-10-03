package vn.edu.dut.connect.organization.application;
import java.util.UUID;
import org.springframework.stereotype.Service;
import vn.edu.dut.connect.identity.application.IdentityDirectoryPort;
import vn.edu.dut.connect.organization.domain.*;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
@Service
public class OrganizationAuthorization {
    private final IdentityDirectoryPort identities;
    private final OrganizationRepository organizations;
    public OrganizationAuthorization(IdentityDirectoryPort identities, OrganizationRepository organizations) {
        this.identities=identities;
        this.organizations=organizations;
    }
    public IdentityDirectoryPort.Account active(UUID actor) {
        var user=identities.findAccount(actor).orElseThrow(()->new ApplicationFailure(401, "AUTHENTICATION_REQUIRED", "Account unavailable"));
        if (!user.active()) throw new ApplicationFailure(403, "ACCESS_DENIED", "Account suspended");
        return user;
    }
    public void admin(UUID actor) {
        if (!active(actor).admin()) denied();
    }
    public void owner(UUID id, UUID actor) {
        active(actor);
        if (organizations.role(id, actor).orElse(null)!=MemberRole.OWNER) denied();
    }
    public void editor(UUID id, UUID actor) {
        active(actor);
        if (!organizations.role(id, actor).map(MemberRole::canRepresent).orElse(false)) denied();
    }
    public void memberOrAdmin(UUID id, UUID actor) {
        var user=active(actor);
        if (!user.admin() && organizations.role(id, actor).isEmpty()) denied();
    }
    private static void denied() {
        throw new ApplicationFailure(403, "ACCESS_DENIED", "Organization permission required");
    }
}
