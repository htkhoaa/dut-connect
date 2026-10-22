package vn.edu.dut.connect.finance.api;

import java.net.URI;
import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.finance.application.*;
import vn.edu.dut.connect.finance.domain.ExpenseStatus;
import vn.edu.dut.connect.identity.application.Pagination;
import vn.edu.dut.connect.shared.api.PageResponse;
import static vn.edu.dut.connect.finance.application.FinanceContracts.*;

@RestController @RequestMapping("/api/v1")
public class FinanceController {
    private final FinanceReadService reads;
    private final ExpenseService expenses;
    public FinanceController(FinanceReadService reads,ExpenseService expenses){this.reads=reads;this.expenses=expenses;}
    @GetMapping("/campaigns/fundraising-progress") public java.util.List<FundraisingProgress> progress(@RequestParam java.util.Set<UUID> campaignIds,Authentication a){return reads.progress(campaignIds,actor(a));}
    @GetMapping("/campaigns/{campaign}/financial-summary") public FinancialSummary summary(@PathVariable UUID campaign,Authentication a){return reads.summary(campaign,actor(a));}
    @GetMapping("/campaigns/{campaign}/expenses") public PageResponse<PublicExpense> approved(@PathVariable UUID campaign,Authentication a,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return PageResponse.from(reads.approved(campaign,actor(a),new Pagination(page,size)));}
    @GetMapping("/campaigns/{campaign}/management/expenses") public PageResponse<ExpenseDto> management(@PathVariable UUID campaign,Authentication a,@RequestParam(required=false) ExpenseStatus status,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return PageResponse.from(reads.management(campaign,actor(a),status,new Pagination(page,size)));}
    @PostMapping("/campaigns/{campaign}/expenses") public ResponseEntity<ExpenseDto> create(@PathVariable UUID campaign,Authentication a,@Valid @RequestBody CreateRequest r){var e=expenses.create(campaign,actor(a),r);return ResponseEntity.created(URI.create("/api/v1/campaigns/"+campaign+"/management/expenses")).body(e);}
    @PatchMapping("/expenses/{id}") public ExpenseDto edit(@PathVariable UUID id,Authentication a,@Valid @RequestBody PatchRequest r){return expenses.edit(id,actor(a),r);}
    @GetMapping("/admin/expenses") public PageResponse<ExpenseDto> admin(Authentication a,@RequestParam(defaultValue="PENDING") ExpenseStatus status,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return PageResponse.from(reads.admin(actor(a),status,new Pagination(page,size)));}
    @PostMapping("/admin/expenses/{id}/approve") public ExpenseDto approve(@PathVariable UUID id,Authentication a,@Valid @RequestBody VersionRequest r){return expenses.approve(id,actor(a),r.version());}
    @PostMapping("/admin/expenses/{id}/reject") public ExpenseDto reject(@PathVariable UUID id,Authentication a,@Valid @RequestBody RejectRequest r){return expenses.reject(id,actor(a),r);}
    private UUID actor(Authentication a){return a==null?null:UUID.fromString(a.getName());}
}
