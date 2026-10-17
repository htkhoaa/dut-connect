package vn.edu.dut.connect.shared.application;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EditionService {
    public record Edition(String edition, long businessTableCount) {}
    private final EditionReadPort database;
    public EditionService(EditionReadPort database) { this.database = database; }
    @Transactional(readOnly = true)
    public Edition describe() { return new Edition("MIDTERM", database.businessTableCount()); }
}
