package vn.edu.dut.connect.campaign.application;
import java.time.LocalDate;
import java.util.*;
import vn.edu.dut.connect.shared.application.PageResult;
public interface PublishedActivityRepository {
    record Activity(UUID id, String title, String summary, String description, String organizer,
        String location, String category, String period, LocalDate publishedOn, String imageUrl, String sourceUrl) {}
    PageResult<Activity> list(String language, String query, String category, int page, int size);
    Optional<Activity> find(UUID id, String language);
}
