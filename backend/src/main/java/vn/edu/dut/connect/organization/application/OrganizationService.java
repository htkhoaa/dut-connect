package vn.edu.dut.connect.organization.application;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.organization.domain.*;
import vn.edu.dut.connect.shared.application.*;
import static vn.edu.dut.connect.organization.application.OrganizationContracts.*;
@Service
public class OrganizationService {
    public enum Moderation {
        VERIFY, SUSPEND, RESTORE
    }
    private static final Logger log=LoggerFactory.getLogger(OrganizationService.class);
    private final OrganizationRepository organizations;
    private final OrganizationAuthorization access;
    private final OrganizationAccessPort representation;
    public OrganizationService(OrganizationRepository organizations, OrganizationAuthorization access, OrganizationAccessPort representation) {
        this.organizations=organizations;
        this.access=access;
        this.representation=representation;
    }
    @Transactional(readOnly=true)
    public PageResult<Summary> browse(OrganizationQuery query, OrganizationStatus status) {
        if (status!=null && status!=OrganizationStatus.VERIFIED)
            throw new ApplicationFailure(400, "VALIDATION_ERROR", "Public browse only exposes verified organizations");
        return organizations.browse(query, OrganizationStatus.VERIFIED, null);
    }
    @Transactional(readOnly=true)
    public PageResult<Summary> mine(UUID actor, OrganizationQuery query) {
        access.active(actor);
        return organizations.browse(query, null, actor);
    }
    @Transactional(readOnly=true)
    public PageResult<Summary> adminList(UUID actor, OrganizationQuery query, OrganizationStatus status) {
        access.admin(actor);
        return organizations.browse(query, status, null);
    }
    @Transactional(readOnly=true)
    public PageResult<TypeSummary> types(UUID actor, OrganizationQuery query) {
        access.active(actor);
        return organizations.types(query);
    }
    @Transactional(readOnly=true)
    public Detail get(UUID id, UUID actor) {
        Organization organization=organizations.find(id).orElseThrow(()->ApplicationFailure.missing("Organization not found"));
        if (organization.status()!=OrganizationStatus.VERIFIED) {
            if (actor==null) throw ApplicationFailure.missing("Organization not found");
            var account=access.active(actor);
            if (!account.admin() && organizations.role(id, actor).isEmpty()) throw ApplicationFailure.missing("Organization not found");
        }
        return detail(organization, actor);
    }
    @Transactional
    public Detail create(UUID actor, CreateRequest request) {
        access.active(actor);
        requireType(request.organizationTypeId(), null);
        String name=name(request.name()), slug=OrganizationSlug.base(name);
        organizations.lockSlugAllocation(slug);
        for (int attempts=0; organizations.slugExists(slug); attempts++) {
            if (attempts>=5) throw ApplicationFailure.conflict("Unable to allocate organization slug; try again");
            slug=OrganizationSlug.suffixed(OrganizationSlug.base(name));
        }
        Organization organization=organizations.save(new Organization(name, slug, request.organizationTypeId(), trim(request.description()), actor));
        organizations.addMember(organization.id(), actor, MemberRole.OWNER);
        log.info("Organization created actor={} organization={}", actor, organization.id());
        return detail(organization, actor);
    }
    @Transactional
    public Detail edit(UUID id, UUID actor, PatchRequest request) {
        Organization organization=locked(id);
        access.editor(id, actor);
        requireVersion(organization, request.version());
        UUID type=request.organizationTypeId()==null?organization.typeId():request.organizationTypeId();
        requireType(type, organization.typeId());
        if (request.clearDescription() && request.description()!=null) throw new ApplicationFailure(400, "VALIDATION_ERROR", "Choose description or clearDescription");
        organization.edit(request.name()==null?organization.name():name(request.name()), type,
        request.clearDescription()?null:request.description()==null?organization.description():trim(request.description()));
        organizations.save(organization);
        return detail(organization, actor);
    }
    @Transactional
    public Detail moderate(UUID id, UUID actor, VersionRequest request, Moderation command) {
        access.admin(actor);
        Organization organization=locked(id);
        requireVersion(organization, request.version());
        switch (command) {
            case VERIFY -> organization.verify(actor);
            case SUSPEND -> organization.suspend();
            case RESTORE -> organization.restore(actor);
        }
        organizations.save(organization);
        log.info("Organization status changed actor={} organization={} status={}", actor, id, organization.status());
        return detail(organization, actor);
    }
    public Organization locked(UUID id) {
        return organizations.lock(id).orElseThrow(()->ApplicationFailure.missing("Organization not found"));
    }
    public void requireVersion(Organization organization, long expected) {
        if (expected<0) throw new ApplicationFailure(400, "VALIDATION_ERROR", "Version must be nonnegative");
        if (organization.version()!=expected) throw new ApplicationFailure(409, "OPTIMISTIC_LOCK_CONFLICT", "Organization changed. Reload and try again.");
    }
    public Detail detail(Organization organization, UUID actor) {
        TypeSummary type=organizations.type(organization.typeId()).orElseThrow(()->ApplicationFailure.missing("Organization type not found"));
        MemberRole role=actor==null?null:organizations.role(organization.id(), actor).orElse(null);
        boolean representative=role!=null && role.canRepresent();
        return new Detail(new Summary(organization.id(), organization.name(), organization.slug(), type.id(), type.name(), organization.status(), organization.version(), organization.createdAt(), organization.description()),
        organization.description(), organization.creatorId(), organization.verifierId(), organization.verifiedAt(), organization.updatedAt(), role,
        representative, role==MemberRole.OWNER, actor!=null && representation.canRepresent(organization.id(), actor));
    }
    private void requireType(UUID id, UUID existing) {
        TypeSummary type=organizations.type(id).orElseThrow(()->new ApplicationFailure(400, "VALIDATION_ERROR", "Organization type not found"));
        if (!type.active() && !id.equals(existing)) throw new ApplicationFailure(400, "VALIDATION_ERROR", "Select an active organization type");
    }
    private static String name(String value) {
        String name=value.trim();
        if (name.isBlank()) throw new ApplicationFailure(400, "VALIDATION_ERROR", "Organization name must not be blank");
        return name;
    }
    private static String trim(String value) {
        return value==null || value.isBlank()?null:value.trim();
    }
}
