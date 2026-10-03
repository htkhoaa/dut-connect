package vn.edu.dut.connect.identity.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {
    @Id
    private UUID id;
    @Column(nullable = false, length = 32)
    private String studentId;
    @Column(nullable = false, length = 255)
    private String email;
    @Column(nullable = false, length = 255)
    private String passwordHash;
    @Column(nullable = false, length = 150)
    private String fullName;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GlobalRole globalRole;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountStatus status;
    @Column(nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;
    @Version
    private Long version;

    protected User() {
    }

    public User(String studentId, String email, String hash, String fullName, GlobalRole role) {
        this.id = UUID.randomUUID();
        this.studentId = studentId;
        this.email = email;
        this.passwordHash = hash;
        this.fullName = fullName;
        this.globalRole = role;
        this.status = AccountStatus.ACTIVE;
        this.createdAt = Instant.now();
        this.updatedAt = createdAt;
    }

    public void rename(String name) {
        fullName = name;
        updatedAt = Instant.now();
    }

    public void changeStatus(AccountStatus next) {
        status = next;
        updatedAt = Instant.now();
    }

    public UUID id() {
        return id;
    }

    public String studentId() {
        return studentId;
    }

    public String email() {
        return email;
    }

    public String passwordHash() {
        return passwordHash;
    }

    public String fullName() {
        return fullName;
    }

    public GlobalRole role() {
        return globalRole;
    }

    public AccountStatus status() {
        return status;
    }

    public Long version() {
        return version;
    }

    public Instant createdAt() {
        return createdAt;
    }
}
