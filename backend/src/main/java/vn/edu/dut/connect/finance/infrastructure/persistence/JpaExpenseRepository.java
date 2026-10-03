package vn.edu.dut.connect.finance.infrastructure.persistence;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.dut.connect.finance.domain.Expense;
public interface JpaExpenseRepository extends JpaRepository<Expense,UUID> {}
