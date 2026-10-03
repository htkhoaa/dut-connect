package vn.edu.dut.connect.volunteer.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="volunteer_registrations")
public class VolunteerRegistration {
    @Id private UUID id;
    @Column(nullable=false) private UUID campaignId;
    @Column(nullable=false) private UUID userId;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private VolunteerTrack preferredTrack;
    @Enumerated(EnumType.STRING) @Column(length=20) private VolunteerTrack assignedTrack;
    @Column(nullable=false,length=1000) private String motivation;
    @Column(length=1000) private String availability;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private RegistrationStatus status;
    @Column(length=1000) private String rejectionReason;
    private UUID reviewedByUserId;
    private Instant reviewedAt;
    @Column(nullable=false) private Instant createdAt;
    @Column(nullable=false) private Instant updatedAt;
    @Version private Long version;
    protected VolunteerRegistration() {}
    public VolunteerRegistration(UUID campaignId, UUID userId, VolunteerTrack preferredTrack, String motivation, String availability) {
        if (campaignId==null) invalid("campaignId","Campaign is required");
        if (userId==null) invalid("userId","Applicant is required");
        if (preferredTrack==null) invalid("preferredTrack","Choose a contribution track");
        this.id=UUID.randomUUID(); this.campaignId=campaignId; this.userId=userId; this.preferredTrack=preferredTrack;
        this.motivation=text(motivation,"motivation",true); this.availability=text(availability,"availability",false);
        status=RegistrationStatus.PENDING; createdAt=Instant.now(); updatedAt=createdAt;
    }
    public void accept(VolunteerTrack track, UUID reviewer) {
        pending(); if(track==null) invalid("assignedTrack","Choose the final contribution track");
        requireReviewer(reviewer);
        assignedTrack=track; status=RegistrationStatus.ACCEPTED; review(reviewer);
    }
    public void reject(String reason, UUID reviewer) {
        pending(); requireReviewer(reviewer); rejectionReason=text(reason,"reason",true); status=RegistrationStatus.REJECTED; review(reviewer);
    }
    public void cancel() { pending(); status=RegistrationStatus.CANCELLED; updatedAt=Instant.now(); }
    public void requireVersion(long expected) {
        if(version==null || version!=expected) throw new VolunteerViolation("OPTIMISTIC_LOCK_CONFLICT","This application changed. Reload and try again.",null);
    }
    private void pending() {
        if(status!=RegistrationStatus.PENDING) throw new VolunteerViolation("INVALID_STATE_TRANSITION","Only pending applications can be reviewed or cancelled",null);
    }
    private void review(UUID actor) { reviewedByUserId=actor; reviewedAt=Instant.now(); updatedAt=reviewedAt; }
    private static void requireReviewer(UUID actor) { if(actor==null) invalid("reviewedByUserId","Reviewer is required"); }
    private static String text(String value,String field,boolean required) {
        if(value!=null && value.indexOf('\0')>=0) invalid(field,"Text cannot contain null characters");
        value=value==null?null:value.trim();
        if(required && (value==null || value.isEmpty())) invalid(field,"Enter a nonblank value");
        if(value!=null && value.length()>1000) invalid(field,"Use at most 1000 characters");
        return value==null || value.isEmpty()?null:value;
    }
    private static void invalid(String field,String message) { throw new VolunteerViolation("VALIDATION_ERROR",message,field); }
    public UUID id(){return id;} public UUID campaignId(){return campaignId;} public UUID userId(){return userId;}
    public VolunteerTrack preferredTrack(){return preferredTrack;} public VolunteerTrack assignedTrack(){return assignedTrack;}
    public String motivation(){return motivation;} public String availability(){return availability;}
    public RegistrationStatus status(){return status;} public String rejectionReason(){return rejectionReason;}
    public UUID reviewedByUserId(){return reviewedByUserId;} public Instant reviewedAt(){return reviewedAt;}
    public Instant createdAt(){return createdAt;} public Instant updatedAt(){return updatedAt;} public Long version(){return version;}
}
