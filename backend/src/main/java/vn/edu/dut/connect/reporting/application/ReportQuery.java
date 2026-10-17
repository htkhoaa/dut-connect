package vn.edu.dut.connect.reporting.application;
import java.util.List;
import java.util.UUID;
public interface ReportQuery {
 record Sheet(String name,List<String> headers,List<List<String>> rows) {}
 List<List<String>> volunteers(UUID campaign);
}
