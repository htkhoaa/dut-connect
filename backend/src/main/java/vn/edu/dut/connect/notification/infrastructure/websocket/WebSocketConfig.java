package vn.edu.dut.connect.notification.infrastructure.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import vn.edu.dut.connect.identity.infrastructure.security.IdentitySettings;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final IdentitySettings settings;

    public WebSocketConfig(NotificationWebSocketHandler notificationWebSocketHandler, IdentitySettings settings) {
        this.notificationWebSocketHandler = notificationWebSocketHandler;
        this.settings = settings;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(notificationWebSocketHandler, "/ws/notifications", "/ws")
                .setAllowedOrigins(settings.origins().toArray(String[]::new));
    }
}
