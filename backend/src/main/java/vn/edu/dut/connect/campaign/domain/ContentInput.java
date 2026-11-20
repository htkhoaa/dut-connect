package vn.edu.dut.connect.campaign.domain;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

/** Values for a new plan or partial edit. Required fields are checked after merging. */
public record ContentInput(
    OrganizerType organizerType,
    UUID organizationId,
    UUID categoryId,
    @Size(max = 200) String title,
    @Size(max = 500) String summary,
    @Size(max = 20000) String description,
    @Size(max = 10000) String expectedImpact,
    ContributionMode contributionMode,
    LocalDate startDate,
    LocalDate endDate,
    Instant applicationDeadline,
    Instant fundraisingDeadline,
    Integer targetVolunteerCount,
    Integer targetTechnicalCount,
    Integer targetLogisticsCount,
    @Size(max = 10000) String volunteerRequirements,
    @Digits(integer = 19, fraction = 0) BigDecimal fundraisingGoal,
    @Digits(integer = 19, fraction = 0) BigDecimal institutionalFunding,
    @Size(max = 200) String sponsorName,
    @Digits(integer = 19, fraction = 0) BigDecimal sponsorFunding,
    @Digits(integer = 19, fraction = 0) BigDecimal estimatedBudget,
    @Size(max = 120) String donationBankName,
    @Size(max = 64) String donationAccountNumber,
    @Size(max = 200) String donationAccountHolder
) {}
