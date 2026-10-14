package vn.edu.dut.connect.campaign.application;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.shared.application.*;

@Service
@Transactional(readOnly = true)
public class PublishedActivityService {
    private final PublishedActivityRepository activities;
    public PublishedActivityService(PublishedActivityRepository activities) {this.activities = activities;}
    public PageResult<PublishedActivityRepository.Activity> list(String lang, String q, String category, int page, int size) {
        if (q.length() > 200 || page < 0 || page > 100000 || size < 1 || size > 100 || category.length() > 100)
            throw new ApplicationFailure(400, "VALIDATION_ERROR", "Invalid activity browse parameters");
        return activities.list(language(lang), q.trim(), category, page, size);
    }
    public PublishedActivityRepository.Activity find(UUID id, String lang) {
        return activities.find(id, language(lang)).orElseThrow(() -> ApplicationFailure.missing("Activity not found"));
    }
    private String language(String value) {
        if (!Set.of("vi", "en").contains(value)) throw new ApplicationFailure(400, "VALIDATION_ERROR", "Unsupported language");
        return value;
    }
}
