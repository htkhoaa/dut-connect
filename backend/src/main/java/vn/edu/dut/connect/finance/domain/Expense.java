package vn.edu.dut.connect.finance.domain;

import jakarta.persistence.*;
import java.math.*;
import java.time.*;
import java.util.UUID;

@Entity @Table(name="campaign_expenses")
public class Expense {
    private static final int MIN_CALENDAR_YEAR=1;
    private static final int MAX_CALENDAR_YEAR=9999;
    @Id private UUID id;
    @Column(nullable=false) private UUID campaignId;
    @Column(nullable=false,length=200) private String title;
    @Column(nullable=false,length=100) private String category;
    @Column(nullable=false,precision=19,scale=0) private BigDecimal amount;
    @Column(nullable=false) private LocalDate expenseDate;
    @Column(length=2000) private String description;
    @Column(length=1000) private String proofReference;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private ExpenseStatus status;
    @Column(nullable=false) private UUID submittedByUserId;
    private UUID reviewedByUserId;
    private Instant reviewedAt;
    @Column(length=1000) private String rejectionReason;
    @Column(nullable=false) private Instant createdAt;
    @Column(nullable=false) private Instant updatedAt;
    @Version private Long version;
    protected Expense() {}
    public Expense(UUID campaign,UUID actor,String title,String category,BigDecimal amount,LocalDate date,String description,String proof) {
        id=UUID.randomUUID();campaignId=campaign;submittedByUserId=actor;status=ExpenseStatus.PENDING;
        createdAt=Instant.now(); edit(title,category,amount,date,description,proof);
    }
    public void edit(String title,String category,BigDecimal amount,LocalDate date,String description,String proof) {
        pending();this.title=required(title,200,"title");this.category=required(category,100,"category");
        if(amount==null) invalid("amount","Amount is required");
        if(amount.signum()<=0) invalid("amount","Amount must be positive");
        if((long)amount.precision()-amount.scale()>19) invalid("amount","Amount must be at most 19 digits");
        var normalized=amount.stripTrailingZeros();
        if(normalized.scale()>0) invalid("amount","Use whole VND amounts");
        // Check the exponent before expanding it into an integer representation.
        amount=normalized.setScale(0);
        if(date==null) invalid("expenseDate","Expense date is required");
        if(date.getYear()<MIN_CALENDAR_YEAR||date.getYear()>MAX_CALENDAR_YEAR) invalid("expenseDate","Use a calendar date from year 0001 through 9999");
        this.amount=amount;expenseDate=date;this.description=optional(description,2000,"description");proofReference=optional(proof,1000,"proofReference");updatedAt=Instant.now();
    }
    public void approve(UUID actor){pending();status=ExpenseStatus.APPROVED;review(actor);}
    public void reject(UUID actor,String reason){pending();rejectionReason=required(reason,1000,"reason");status=ExpenseStatus.REJECTED;review(actor);}
    private void review(UUID actor){reviewedByUserId=actor;reviewedAt=Instant.now();updatedAt=reviewedAt;}
    private void pending(){if(status!=ExpenseStatus.PENDING)throw new ExpenseViolation("EXPENSE_NOT_PENDING","Only pending expenses can be changed or reviewed",null);}
    public void requireVersion(long expected){if(version!=expected)throw new ExpenseViolation("OPTIMISTIC_LOCK_CONFLICT","This expense changed. Reload and try again.",null);}
    private static String required(String value,int max,String field){String v=optional(value,max,field);if(v==null)invalid(field,"This field is required");return v;}
    private static String optional(String value,int max,String field){if(value==null)return null;String v=value.trim();if(v.length()>max)invalid(field,"Maximum length is "+max);return v.isEmpty()?null:v;}
    private static void invalid(String field,String message){throw new ExpenseViolation("VALIDATION_ERROR",message,field);}
    public UUID id(){return id;} public UUID campaignId(){return campaignId;} public String title(){return title;} public String category(){return category;}
    public BigDecimal amount(){return amount;} public LocalDate expenseDate(){return expenseDate;} public String description(){return description;} public String proofReference(){return proofReference;}
    public ExpenseStatus status(){return status;} public UUID submittedByUserId(){return submittedByUserId;} public UUID reviewedByUserId(){return reviewedByUserId;}
    public Instant reviewedAt(){return reviewedAt;} public String rejectionReason(){return rejectionReason;} public Instant createdAt(){return createdAt;} public Instant updatedAt(){return updatedAt;} public Long version(){return version;}
}
