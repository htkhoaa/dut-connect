package vn.edu.dut.connect.organization.domain;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="organization_types")
public class OrganizationType {
    @Id private UUID id;
    @Column(nullable=false, length=50) private String code;
    @Column(nullable=false, length=120) private String name;
    @Column(nullable=false) private boolean active;
    @Column(nullable=false) private Instant createdAt;
    protected OrganizationType() {
    }
    public UUID id() {
        return id;
    }
    public String code() {
        return code;
    }
    public String name() {
        return name;
    }
    public boolean active() {
        return active;
    }
}
