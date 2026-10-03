package vn.edu.dut.connect.reporting.application;

import java.util.List;

public interface ExcelReportWriter { byte[] write(List<ReportQuery.Sheet> sheets); }
