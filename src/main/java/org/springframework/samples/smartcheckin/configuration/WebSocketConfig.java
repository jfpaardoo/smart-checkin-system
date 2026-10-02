package org.springframework.samples.smartcheckin.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtBlacklistService;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtUtils;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsServiceImpl;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

import java.security.Principal;
import java.util.Arrays;

@Configuration
@EnableWebSocketMessageBroker
@SuppressWarnings({ "null", "java:S2638" })
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins = "http://localhost:3000";

    private final JwtUtils jwtUtils;
    private final UserDetailsServiceImpl userDetailsService;
    private final JwtBlacklistService jwtBlacklistService;

    public WebSocketConfig() {
        this(null, null, null);
    }

    public WebSocketConfig(JwtUtils jwtUtils,
                           UserDetailsServiceImpl userDetailsService,
                           JwtBlacklistService jwtBlacklistService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
        this.jwtBlacklistService = jwtBlacklistService;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins)
                .withSockJS();

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(origins);
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(10 * 1024 * 1024);
        registration.setSendBufferSizeLimit(10 * 1024 * 1024);
        registration.setSendTimeLimit(20 * 1000);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null) {
                    if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                        authenticateConnection(accessor);
                    } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                        authorizeSubscription(accessor);
                    }
                }
                return message;
            }
        });
    }

    private void authenticateConnection(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        String jwt = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
        } else {
            jwt = accessor.getFirstNativeHeader("token");
        }

        if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
            if (jwtBlacklistService != null && jwtBlacklistService.isBlacklisted(jwt)) {
                return;
            }
            String username = jwtUtils.getUserNameFromJwtToken(jwt);
            if (username != null) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                accessor.setUser(auth);
            }
        }
    }

    private void authorizeSubscription(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null) {
            return;
        }

        Principal principal = accessor.getUser();

        // 1. Topics administrativos protegidos
        if ((destination.startsWith("/topic/audit")
                || destination.startsWith("/topic/users")
                || destination.startsWith("/topic/alerts")
                || destination.startsWith("/topic/statistics"))
                && !isAdmin(principal)) {
            throw new AccessDeniedException("Acceso no autorizado al canal administrativo: " + destination);
        }

        // 2. Notificaciones privadas por usuario
        if (destination.startsWith("/topic/notifications/")) {
            String targetUser = destination.substring("/topic/notifications/".length()).trim();
            if (targetUser.contains("/")) {
                targetUser = targetUser.substring(0, targetUser.indexOf('/'));
            }
            if (principal == null || (!principal.getName().equalsIgnoreCase(targetUser) && !isAdmin(principal))) {
                throw new AccessDeniedException("Acceso no autorizado a las notificaciones privadas de: " + targetUser);
            }
        }
    }

    private boolean isAdmin(Principal principal) {
        if (principal instanceof Authentication auth) {
            return auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ADMIN"));
        }
        return false;
    }
}
