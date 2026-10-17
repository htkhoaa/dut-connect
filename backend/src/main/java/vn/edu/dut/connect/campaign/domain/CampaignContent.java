package vn.edu.dut.connect.campaign.domain;
import jakarta.persistence.*;
import java.util.*;
import java.time.*;
import java.math.BigDecimal;
@Embeddable
public class CampaignContent {
    @Enumerated(EnumType.STRING) @Column(name="organizer_type") private OrganizerType organizerType;
    @Column(name="organization_id") private UUID organizationId;
    @Column(name="category_id") private UUID categoryId;
    @Column(length=200) private String title;
    @Column(length=500) private String summary;
    @Column(name="description") private String description;
    @Column(name="expected_impact") private String expectedImpact;
    @Enumerated(EnumType.STRING) @Column(name="contribution_mode") private ContributionMode contributionMode;
    @Column(name="start_date") private LocalDate startDate;
    @Column(name="end_date") private LocalDate endDate;
    @Column(name="application_deadline") private Instant applicationDeadline;
    @Column(name="fundraising_deadline") private Instant fundraisingDeadline;
    @Column(name="target_volunteer_count") private Integer targetVolunteerCount;
    @Column(name="target_technical_count") private Integer targetTechnicalCount;
    @Column(name="target_logistics_count") private Integer targetLogisticsCount;
    @Column(name="volunteer_requirements") private String volunteerRequirements;
    @Column(precision=19, scale=0) private BigDecimal fundraisingGoal;
    @Column(precision=19, scale=0) private BigDecimal institutionalFunding;
    @Column(length=200) private String sponsorName;
    @Column(precision=19, scale=0) private BigDecimal sponsorFunding;
    @Column(precision=19, scale=0) private BigDecimal estimatedBudget;
    protected CampaignContent() {}
    public CampaignContent(ContentInput input) {
        organizerType = input.organizerType();
        organizationId = input.organizationId();
        categoryId = input.categoryId();
        title = normalize(input.title());
        summary = normalize(input.summary());
        description = normalize(input.description());
        expectedImpact = normalize(input.expectedImpact());
        contributionMode = input.contributionMode();
        startDate = input.startDate();
        endDate = input.endDate();
        applicationDeadline = input.applicationDeadline();
        fundraisingDeadline = input.fundraisingDeadline();
        targetVolunteerCount = input.targetVolunteerCount();
        targetTechnicalCount = input.targetTechnicalCount();
        targetLogisticsCount = input.targetLogisticsCount();
        volunteerRequirements = normalize(input.volunteerRequirements());
        fundraisingGoal = input.fundraisingGoal();
        institutionalFunding = input.institutionalFunding() == null ? BigDecimal.ZERO : input.institutionalFunding();
        sponsorName = normalize(input.sponsorName());
        sponsorFunding = input.sponsorFunding() == null ? BigDecimal.ZERO : input.sponsorFunding();
        estimatedBudget = input.estimatedBudget();
        validate();
        fundraisingGoal = wholeMoney(fundraisingGoal);
        institutionalFunding = wholeMoney(institutionalFunding);
        sponsorFunding = wholeMoney(sponsorFunding);
        estimatedBudget = wholeMoney(estimatedBudget);
    }
    public CampaignContent merge(ContentInput patch, Set<String> clearFields) {
        Set<String> clears = clearFields == null ? Set.of() : clearFields;
        if (!Set.of("organizationId", "expectedImpact", "applicationDeadline", "fundraisingDeadline", "targetVolunteerCount", "targetTechnicalCount", "targetLogisticsCount", "volunteerRequirements", "fundraisingGoal", "sponsorName", "estimatedBudget").containsAll(clears))
            invalid("clearFields", "Only optional fields may be cleared");
        for (String field : clears) {
            boolean supplied = switch (field) {
                case "organizationId" -> patch.organizationId() != null;
                case "expectedImpact" -> patch.expectedImpact() != null;
                case "applicationDeadline" -> patch.applicationDeadline() != null;
                case "fundraisingDeadline" -> patch.fundraisingDeadline() != null;
                case "targetVolunteerCount" -> patch.targetVolunteerCount() != null;
                case "targetTechnicalCount" -> patch.targetTechnicalCount() != null;
                case "targetLogisticsCount" -> patch.targetLogisticsCount() != null;
                case "volunteerRequirements" -> patch.volunteerRequirements() != null;
                case "fundraisingGoal" -> patch.fundraisingGoal() != null;
                case "sponsorName" -> patch.sponsorName() != null;
                case "estimatedBudget" -> patch.estimatedBudget() != null;
                default -> false;
            };
            if (supplied) invalid(field, "Choose a value or clearFields, not both");
        }
        return new CampaignContent(new ContentInput(
            patch.organizerType() == null ? organizerType : patch.organizerType(),
            clears.contains("organizationId") ? null : patch.organizationId() == null ? organizationId : patch.organizationId(),
            patch.categoryId() == null ? categoryId : patch.categoryId(),
            patch.title() == null ? title : patch.title(),
            patch.summary() == null ? summary : patch.summary(),
            patch.description() == null ? description : patch.description(),
            clears.contains("expectedImpact") ? null : patch.expectedImpact() == null ? expectedImpact : patch.expectedImpact(),
            patch.contributionMode() == null ? contributionMode : patch.contributionMode(),
            patch.startDate() == null ? startDate : patch.startDate(),
            patch.endDate() == null ? endDate : patch.endDate(),
            clears.contains("applicationDeadline") ? null : patch.applicationDeadline() == null ? applicationDeadline : patch.applicationDeadline(),
            clears.contains("fundraisingDeadline") ? null : patch.fundraisingDeadline() == null ? fundraisingDeadline : patch.fundraisingDeadline(),
            clears.contains("targetVolunteerCount") ? null : patch.targetVolunteerCount() == null ? targetVolunteerCount : patch.targetVolunteerCount(),
            clears.contains("targetTechnicalCount") ? null : patch.targetTechnicalCount() == null ? targetTechnicalCount : patch.targetTechnicalCount(),
            clears.contains("targetLogisticsCount") ? null : patch.targetLogisticsCount() == null ? targetLogisticsCount : patch.targetLogisticsCount(),
            clears.contains("volunteerRequirements") ? null : patch.volunteerRequirements() == null ? volunteerRequirements : patch.volunteerRequirements(),
            clears.contains("fundraisingGoal") ? null : patch.fundraisingGoal() == null ? fundraisingGoal : patch.fundraisingGoal(),
            patch.institutionalFunding() == null ? institutionalFunding : patch.institutionalFunding(),
            clears.contains("sponsorName") ? null : patch.sponsorName() == null ? sponsorName : patch.sponsorName(),
            patch.sponsorFunding() == null ? sponsorFunding : patch.sponsorFunding(),
            clears.contains("estimatedBudget") ? null : patch.estimatedBudget() == null ? estimatedBudget : patch.estimatedBudget()
        ));
    }
    public ContentInput values() {
        return new ContentInput(organizerType, organizationId, categoryId, title, summary, description, expectedImpact, contributionMode, startDate, endDate, applicationDeadline, fundraisingDeadline, targetVolunteerCount, targetTechnicalCount, targetLogisticsCount, volunteerRequirements, fundraisingGoal, institutionalFunding, sponsorName, sponsorFunding, estimatedBudget);
    }
    private void validate() {
        if (organizerType == null) invalid("organizerType", "Choose an organizer type");
        if ((organizerType == OrganizerType.ORGANIZATION) != (organizationId != null))
            invalid("organizationId", "Organization is required only for organization proposals");
        if (categoryId == null) invalid("categoryId", "Choose a category");
        text("title", title, 200, true); text("summary", summary, 500, true);
        text("description", description, 20000, true); text("expectedImpact", expectedImpact, 10000, false);
        text("volunteerRequirements", volunteerRequirements, 10000, false); text("sponsorName", sponsorName, 200, false);
        if (contributionMode != ContributionMode.VOLUNTEER_ONLY) invalid("contributionMode", "The midterm edition supports volunteer campaigns only");
        if (contributionMode == null) invalid("contributionMode", "Choose a contribution mode");
        if (startDate == null || endDate == null || endDate.isBefore(startDate))
            invalid("endDate", "End date must be on or after start date");
        count("targetVolunteerCount", targetVolunteerCount); count("targetTechnicalCount", targetTechnicalCount); count("targetLogisticsCount", targetLogisticsCount);
        if (contributionMode != ContributionMode.DONATION_ONLY && (targetVolunteerCount == null || targetVolunteerCount < 1))
            invalid("targetVolunteerCount", "Volunteer campaigns require at least one volunteer");
        if (contributionMode == ContributionMode.DONATION_ONLY &&
            ((targetVolunteerCount != null && targetVolunteerCount != 0) || (targetTechnicalCount != null && targetTechnicalCount != 0) || (targetLogisticsCount != null && targetLogisticsCount != 0)))
            invalid("targetVolunteerCount", "Donation-only campaigns cannot have volunteer targets");
        if (targetTechnicalCount != null && targetLogisticsCount != null && targetVolunteerCount != null &&
            (long)targetTechnicalCount + targetLogisticsCount > targetVolunteerCount)
            invalid("targetTechnicalCount", "Technical and logistics targets cannot exceed the volunteer target");
        if (contributionMode == ContributionMode.VOLUNTEER_ONLY && (fundraisingGoal != null || fundraisingDeadline != null))
            invalid("fundraisingGoal", "Volunteer-only campaigns cannot configure fundraising");
        if (fundraisingGoal != null || fundraisingDeadline != null || institutionalFunding.signum() != 0 || sponsorFunding.signum() != 0 || sponsorName != null || estimatedBudget != null)
            invalid("institutionalFunding", "Financial planning is outside the midterm scope");
        money("fundraisingGoal", fundraisingGoal, true); money("institutionalFunding", institutionalFunding, false);
        money("sponsorFunding", sponsorFunding, false); money("estimatedBudget", estimatedBudget, false);
    }
    private static void money(String field, BigDecimal value, boolean positive) {
        if (value == null) return;
        if (value.signum() < 0 || (positive && value.signum() == 0) ||
            (value.signum() != 0 && (long)value.precision() - value.scale() > 19) ||
            value.stripTrailingZeros().scale() > 0)
            invalid(field, "Enter an integer VND amount within 19 digits" + (positive ? " greater than zero" : " or zero"));
    }
    private static BigDecimal wholeMoney(BigDecimal value) { return value == null ? null : value.setScale(0); }
    private static void count(String field, Integer value) { if (value != null && value < 0) invalid(field, "Target cannot be negative"); }
    private static void text(String field, String value, int max, boolean required) {
        if (value != null && value.indexOf('\0') >= 0) invalid(field, "Text cannot contain null characters");
        if ((required && value == null) || (value != null && value.length() > max)) invalid(field, "Value is required where applicable and must be at most " + max + " characters");
    }
    private static String normalize(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static void invalid(String field, String message) { throw new CampaignViolation("VALIDATION_ERROR", message, field); }
    public OrganizerType organizerType() { return organizerType; }
    public UUID organizationId() { return organizationId; }
    public UUID categoryId() { return categoryId; }
    public String title() { return title; }
    public String summary() { return summary; }
    public String description() { return description; }
    public String expectedImpact() { return expectedImpact; }
    public ContributionMode contributionMode() { return contributionMode; }
    public LocalDate startDate() { return startDate; }
    public LocalDate endDate() { return endDate; }
    public Instant applicationDeadline() { return applicationDeadline; }
    public Instant fundraisingDeadline() { return fundraisingDeadline; }
    public Integer targetVolunteerCount() { return targetVolunteerCount; }
    public Integer targetTechnicalCount() { return targetTechnicalCount; }
    public Integer targetLogisticsCount() { return targetLogisticsCount; }
    public String volunteerRequirements() { return volunteerRequirements; }
    public BigDecimal fundraisingGoal() { return fundraisingGoal; }
    public BigDecimal institutionalFunding() { return institutionalFunding; }
    public String sponsorName() { return sponsorName; }
    public BigDecimal sponsorFunding() { return sponsorFunding; }
    public BigDecimal estimatedBudget() { return estimatedBudget; }
}
