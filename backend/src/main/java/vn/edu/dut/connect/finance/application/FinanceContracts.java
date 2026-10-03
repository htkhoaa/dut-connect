package vn.edu.dut.connect.finance.application;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import jakarta.validation.constraints.*;
import vn.edu.dut.connect.finance.domain.*;

public final class FinanceContracts {
    private FinanceContracts() {}
    public record CreateRequest(@NotBlank @Size(max=200) String title,@NotBlank @Size(max=100) String category,
        @NotNull BigDecimal amount,@NotNull LocalDate expenseDate,@Size(max=2000) String description,@Size(max=1000) String proofReference) {}
    public record PatchRequest(@Size(max=200) String title,@Size(max=100) String category,BigDecimal amount,LocalDate expenseDate,
        @Size(max=2000) String description,@Size(max=1000) String proofReference,@Size(max=2) Set<@NotBlank String> clearFields,@NotNull @PositiveOrZero Long version) {}
    public record VersionRequest(@NotNull @PositiveOrZero Long version) {}
    public record RejectRequest(@NotBlank @Size(max=1000) String reason,@NotNull @PositiveOrZero Long version) {}
    public record PublicExpense(UUID id,UUID campaignId,String title,String category,String amount,LocalDate expenseDate,String description,String proofReference,Instant approvedAt) {
        public static PublicExpense from(Expense e){return new PublicExpense(e.id(),e.campaignId(),e.title(),e.category(),e.amount().toPlainString(),e.expenseDate(),e.description(),e.proofReference(),e.reviewedAt());}
    }
    public record ExpenseDto(UUID id,UUID campaignId,String campaignTitle,String title,String category,String amount,LocalDate expenseDate,String description,String proofReference,
        ExpenseStatus status,UUID submittedByUserId,String submittedByName,UUID reviewedByUserId,String reviewedByName,Instant reviewedAt,String rejectionReason,Instant createdAt,Instant updatedAt,long version,boolean canEdit) {}
    public record FinancialSummary(UUID campaignId,String institutionalFunding,String sponsorFunding,String verifiedDonations,String totalFunding,String approvedExpenses,String remainingFunds,String fundraisingGoal,long successfulDonationCount) {}
    public record FundraisingProgress(UUID campaignId,String verifiedDonations,long successfulDonationCount) {}
}
