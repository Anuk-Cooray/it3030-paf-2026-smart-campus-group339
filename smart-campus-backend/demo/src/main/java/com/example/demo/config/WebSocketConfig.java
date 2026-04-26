package com.example.demo.config;

import com.example.demo.security.JwtService;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;

    public WebSocketConfig(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5173", "http://localhost:5174")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(
                new ChannelInterceptor() {
                    @Override
                    public Message<?> preSend(Message<?> message, MessageChannel channel) {
                        StompHeaderAccessor accessor =
                                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                        if (accessor == null || accessor.getCommand() != StompCommand.CONNECT) {
                            return message;
                        }

                        String token = resolveToken(accessor);
                        if (token == null || token.isBlank()) {
                            throw new IllegalArgumentException("Missing WebSocket Authorization token");
                        }

                        try {
                            Authentication authentication = jwtService.authenticateToken(token);
                            accessor.setUser(authentication);
                        } catch (Exception e) {
                            throw new IllegalArgumentException("Invalid WebSocket Authorization token", e);
                        }

                        return message;
                    }
                });
    }

    private static String resolveToken(StompHeaderAccessor accessor) {
        String value = accessor.getFirstNativeHeader("Authorization");
        if (value == null || value.isBlank()) {
            value = accessor.getFirstNativeHeader("authorization");
        }
        if (value == null || value.isBlank()) {
            value = accessor.getFirstNativeHeader("token");
        }
        if (value == null || value.isBlank()) {
            value = accessor.getFirstNativeHeader("access_token");
        }
        if (value == null) {
            return null;
        }
        return value.regionMatches(true, 0, "Bearer ", 0, "Bearer ".length())
                ? value.substring("Bearer ".length()).trim()
                : value.trim();
    }
}
