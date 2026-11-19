package vn.edu.dut.connect.finance.application;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.*;
import org.junit.jupiter.api.Test;
import vn.edu.dut.connect.campaign.application.CampaignAccessPort;
import vn.edu.dut.connect.finance.domain.Expense;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ExpenseReceiptServiceTest {
    private final ExpenseRepository repository = mock(ExpenseRepository.class);
    private final FinanceAuthorization access = mock(FinanceAuthorization.class);
    private final CampaignAccessPort campaigns = mock(CampaignAccessPort.class);
    private final ExpenseReceiptService service = new ExpenseReceiptService(repository, access, campaigns);

    private Expense expense() {
        var expense = new Expense(UUID.randomUUID(), UUID.randomUUID(), "Water", "Supplies", new BigDecimal("20000"), LocalDate.now(), null, null);
        expense.setReceiptData(new byte[]{1, 2}, "image/png");
        when(repository.find(expense.id())).thenReturn(Optional.of(expense));
        return expense;
    }

    @Test void anonymousCannotReadPendingReceipt() {
        var expense = expense();
        assertThrows(ApplicationFailure.class, () -> service.download(expense.id(), null));
    }

    @Test void unrelatedUserCannotReadPendingReceipt() {
        var expense = expense();
        var actor = UUID.randomUUID();
        doThrow(new ApplicationFailure(403, "ACCESS_DENIED", "Denied")).when(access).manager(expense.campaignId(), actor);
        assertThrows(ApplicationFailure.class, () -> service.download(expense.id(), actor));
    }

    @Test void managerCanReadPendingReceipt() {
        var expense = expense();
        var actor = UUID.randomUUID();
        assertArrayEquals(new byte[]{1, 2}, service.download(expense.id(), actor).data());
        verify(access).manager(expense.campaignId(), actor);
    }
}
