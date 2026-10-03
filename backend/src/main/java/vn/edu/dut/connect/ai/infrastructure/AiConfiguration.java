package vn.edu.dut.connect.ai.infrastructure;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import vn.edu.dut.connect.ai.application.AiService;

@Configuration(proxyBeanMethods = false)
public class AiConfiguration {
    @Bean
    AiService aiService(AiSettings settings, ObjectMapper json) {
        return settings.enabled() ? new OpenAiCompatibleService(settings, json) : new DisabledAiService(settings);
    }
}
