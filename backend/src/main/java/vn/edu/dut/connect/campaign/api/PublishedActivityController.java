package vn.edu.dut.connect.campaign.api;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;
import vn.edu.dut.connect.campaign.application.*;
import vn.edu.dut.connect.shared.api.PageResponse;

@RestController
@RequestMapping("/api/v1/activities")
public class PublishedActivityController {
    private final PublishedActivityService service;
    public PublishedActivityController(PublishedActivityService service) {this.service = service;}
    @GetMapping
    public PageResponse<PublishedActivityRepository.Activity> list(@RequestParam(defaultValue="vi") String lang,
        @RequestParam(defaultValue="") String q, @RequestParam(defaultValue="") String category,
        @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size) {
        return PageResponse.from(service.list(lang, q, category, page, size));
    }
    @GetMapping("/{id}")
    public PublishedActivityRepository.Activity get(@PathVariable UUID id, @RequestParam(defaultValue="vi") String lang) {
        return service.find(id, lang);
    }
}
