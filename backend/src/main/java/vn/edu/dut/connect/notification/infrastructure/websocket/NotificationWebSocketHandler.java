package vn.edu.dut.connect.notification.infrastructure.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class NotificationWebSocketHandler extends TextWebSocketHandler {
    private static final Logger log = LoggerFactory.getLogger(NotificationWebSocketHandler.class);
    private final Map<UUID, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
    private final Set<WebSocketSession> allSessions = new CopyOnWriteArraySet<>();
    private final ObjectMapper json;
    private final JwtDecoder jwtDecoder;

    public NotificationWebSocketHandler(ObjectMapper json, JwtDecoder jwtDecoder) {
        this.json = json;
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        allSessions.add(session);
        UUID userId = extractUserId(session);
        if (userId != null) {
            session.getAttributes().put("userId", userId);
            userSessions.computeIfAbsent(userId, k -> new CopyOnWriteArraySet<>()).add(session);
            log.info("WebSocket connected user={} session={}", userId, session.getId());
        } else {
            log.info("WebSocket connected anonymous session={}", session.getId());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        allSessions.remove(session);
        UUID userId = (UUID) session.getAttributes().get("userId");
        if (userId != null) {
            Set<WebSocketSession> sessions = userSessions.get(userId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    userSessions.remove(userId);
                }
            }
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // Can handle ping/pong or client subscriptions if needed
        try {
            if ("ping".equalsIgnoreCase(message.getPayload().trim())) {
                session.sendMessage(new TextMessage("pong"));
            }
        } catch (Exception ignored) {}
    }

    public void sendToUser(UUID userId, Object message) {
        Set<WebSocketSession> sessions = userSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) return;

        try {
            String text = json.writeValueAsString(message);
            TextMessage textMessage = new TextMessage(text);
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (Exception e) {
                        log.warn("Failed sending WS to user={}: {}", userId, e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("JSON error serialization for WS: {}", e.getMessage());
        }
    }

    public void broadcast(Object message) {
        try {
            String text = json.writeValueAsString(message);
            TextMessage textMessage = new TextMessage(text);
            for (WebSocketSession session : allSessions) {
                if (session.isOpen()) {
                    try {
                        session.sendMessage(textMessage);
                    } catch (Exception e) {
                        log.warn("Failed broadcasting WS: {}", e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("JSON error serialization for WS broadcast: {}", e.getMessage());
        }
    }

    private UUID extractUserId(WebSocketSession session) {
        URI uri = session.getUri();
        if (uri == null || uri.getQuery() == null) return null;

        for (String param : uri.getQuery().split("&")) {
            String[] parts = param.split("=", 2);
            if (parts.length == 2 && "token".equalsIgnoreCase(parts[0])) {
                String token = parts[1];
                try {
                    Jwt jwt = jwtDecoder.decode(token);
                    return UUID.fromString(jwt.getSubject());
                } catch (Exception e) {
                    log.debug("Invalid token in WS connection: {}", e.getMessage());
                }
            }
        }
        return null;
    }
}
