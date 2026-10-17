package vn.edu.dut.connect.reporting.application;

import java.util.UUID;
import org.springframework.stereotype.Service;

/** Workbook serialization runs after the read snapshot transaction has closed. */
@Service
public class ReportExportService {
    private final ReportService reports;
    private final ExcelReportWriter writer;
    public ReportExportService(ReportService reports, ExcelReportWriter writer) { this.reports=reports; this.writer=writer; }
    public byte[] volunteers(UUID id, UUID actor) { return writer.write(reports.volunteers(id,actor)); }
}
