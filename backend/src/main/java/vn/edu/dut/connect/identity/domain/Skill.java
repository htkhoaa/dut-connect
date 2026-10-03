package vn.edu.dut.connect.identity.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "skills")
public class Skill {
    @Id
    private UUID id;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(nullable = false)
    private boolean active;
    @Column(nullable = false)
    private Instant createdAt;

    protected Skill() {
    }

    public UUID id() {
        return id;
    }

    public String name() {
        return name;
    }

    public boolean active() {
        return active;
    }
}
