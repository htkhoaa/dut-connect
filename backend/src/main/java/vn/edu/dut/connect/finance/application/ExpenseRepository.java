package vn.edu.dut.connect.finance.application;

import java.util.*;
import java.math.BigDecimal;
import vn.edu.dut.connect.finance.domain.*;
import vn.edu.dut.connect.identity.application.Pagination;
import vn.edu.dut.connect.shared.application.PageResult;

public interface ExpenseRepository {
    Optional<Expense> find(UUID id);
    Expense save(Expense expense);
    PageResult<Expense> list(UUID campaign,ExpenseStatus status,Pagination page);
    BigDecimal approvedAmount(UUID campaign);
}
