package vn.edu.dut.connect.shared.infrastructure.catalog;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import vn.edu.dut.connect.shared.application.DutCatalogueSeedService;

@Component
@Order(200)
public class DutCatalogueRunner implements ApplicationRunner {
    private final DutCatalogueSeedService service;
    private final ObjectMapper mapper;
    private final boolean enabled;
    public DutCatalogueRunner(DutCatalogueSeedService service, ObjectMapper mapper,
            @Value("${app.dut-catalogue.enabled:true}") boolean enabled) {
        this.service = service; this.mapper = mapper; this.enabled = enabled;
    }
    public void run(ApplicationArguments args) throws java.io.IOException {
        if (!enabled) return;
        try (var input = new ClassPathResource("catalogue/dut-catalogue.json").getInputStream()) {
            service.importCatalogue(mapper.readValue(input, DutCatalogueSeedService.Catalogue.class));
        }
    }
}
