package vn.edu.dut.connect.identity.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "student_profiles")
public class StudentProfile {
    @Id
    private UUID userId;
    @Column(nullable = false, length = 150)
    private String faculty;
    @Column(length = 500)
    private String bio;
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ContributionTrack preferredTrack;
    @Column(columnDefinition = "text")
    private String experience;
    @Column(nullable = false)
    private Instant createdAt;
    @Column(nullable = false)
    private Instant updatedAt;
    @Version
    private Long version;

    protected StudentProfile() {
    }

    public StudentProfile(UUID userId, String faculty) {
        this.userId = userId;
        this.faculty = faculty;
        createdAt = Instant.now();
        updatedAt = createdAt;
    }

    public void update(String faculty, String bio, ContributionTrack track, String experience) {
        this.faculty = faculty;
        this.bio = bio;
        this.preferredTrack = track;
        this.experience = experience;
        touch();
    }

    public void touch() {
        updatedAt = Instant.now();
    }

    public String faculty() {
        return faculty;
    }

    public String bio() {
        return bio;
    }

    public ContributionTrack preferredTrack() {
        return preferredTrack;
    }

    public String experience() {
        return experience;
    }

    public Long version() {
        return version;
    }
}
