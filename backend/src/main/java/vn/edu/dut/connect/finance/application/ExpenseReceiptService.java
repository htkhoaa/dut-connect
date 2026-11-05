package vn.edu.dut.connect.finance.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.finance.domain.Expense;
import vn.edu.dut.connect.finance.domain.ExpenseStatus;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

import java.util.UUID;

@Service
public class ExpenseReceiptService {

    private final ExpenseRepository expenseRepository;
    private final FinanceAuthorization access;

    public ExpenseReceiptService(ExpenseRepository expenseRepository, FinanceAuthorization access) {
        this.expenseRepository = expenseRepository;
        this.access = access;
    }

    public record ReceiptData(byte[] data, String contentType) {}

    @Transactional
    public void upload(UUID expenseId, UUID actorId, byte[] data, String contentType) {
        Expense expense = expenseRepository.find(expenseId)
                .orElseThrow(() -> ApplicationFailure.missing("Expense not found"));
        // Require manager access on campaign
        access.manager(expense.campaignId(), actorId);
        if (expense.status() != ExpenseStatus.PENDING) {
            throw new ApplicationFailure(400, "EXPENSE_NOT_PENDING", "Can only upload receipt for pending expenses");
        }
        expense.setReceiptData(data, contentType);
        expenseRepository.save(expense);
    }

    @Transactional(readOnly = true)
    public ReceiptData download(UUID expenseId, UUID actorId) {
        Expense expense = expenseRepository.find(expenseId)
                .orElseThrow(() -> ApplicationFailure.missing("Expense not found"));
        if (expense.receiptData() == null || expense.receiptData().length == 0) {
            throw ApplicationFailure.missing("No receipt uploaded for this expense");
        }
        return new ReceiptData(expense.receiptData(), expense.receiptContentType());
    }

    @Transactional
    public void delete(UUID expenseId, UUID actorId) {
        Expense expense = expenseRepository.find(expenseId)
                .orElseThrow(() -> ApplicationFailure.missing("Expense not found"));
        access.manager(expense.campaignId(), actorId);
        if (expense.status() != ExpenseStatus.PENDING) {
            throw new ApplicationFailure(400, "EXPENSE_NOT_PENDING", "Can only delete receipt for pending expenses");
        }
        expense.setReceiptData(null, null);
        expenseRepository.save(expense);
    }
}
