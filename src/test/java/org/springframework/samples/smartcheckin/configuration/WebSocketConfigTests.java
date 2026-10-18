package org.springframework.samples.smartcheckin.configuration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtBlacklistService;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtUtils;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsServiceImpl;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.StompWebSocketEndpointRegistration;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
class WebSocketConfigTests {

    @Mock
    private MessageBrokerRegistry messageBrokerRegistry;

    @Mock
    private StompEndpointRegistry stompEndpointRegistry;

    @Mock
    private StompWebSocketEndpointRegistration endpointRegistration;

    @Mock
    private WebSocketTransportRegistration transportRegistration;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private UserDetailsServiceImpl userDetailsService;

    @Mock
    private JwtBlacklistService jwtBlacklistService;

    @Mock
    private WebSocketTicketService webSocketTicketService;

    @Mock
    private ChannelRegistration channelRegistration;

    @Mock
    private MessageChannel messageChannel;

    private WebSocketConfig webSocketConfig;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        webSocketConfig = new WebSocketConfig(jwtUtils, userDetailsService, jwtBlacklistService, webSocketTicketService);
    }

    @Test
    void testConfigureMessageBroker() {
        webSocketConfig.configureMessageBroker(messageBrokerRegistry);
        verify(messageBrokerRegistry).enableSimpleBroker("/topic");
        verify(messageBrokerRegistry).setApplicationDestinationPrefixes("/app");
    }

    @Test
    void testRegisterStompEndpoints() {
        when(stompEndpointRegistry.addEndpoint(anyString())).thenReturn(endpointRegistration);
        when(endpointRegistration.setAllowedOriginPatterns(any())).thenReturn(endpointRegistration);

        webSocketConfig.registerStompEndpoints(stompEndpointRegistry);
        verify(stompEndpointRegistry, atLeastOnce()).addEndpoint("/ws");
    }

    @Test
    void testConfigureWebSocketTransportReducesBufferLimits() {
        when(transportRegistration.setMessageSizeLimit(anyInt())).thenReturn(transportRegistration);
        when(transportRegistration.setSendBufferSizeLimit(anyInt())).thenReturn(transportRegistration);
        when(transportRegistration.setSendTimeLimit(anyInt())).thenReturn(transportRegistration);

        webSocketConfig.configureWebSocketTransport(transportRegistration);
        verify(transportRegistration).setMessageSizeLimit(256 * 1024);
        verify(transportRegistration).setSendBufferSizeLimit(512 * 1024);
        verify(transportRegistration).setSendTimeLimit(10 * 1000);
    }

    private ChannelInterceptor captureInterceptor() {
        ArgumentCaptor<ChannelInterceptor> captor = ArgumentCaptor.forClass(ChannelInterceptor.class);
        webSocketConfig.configureClientInboundChannel(channelRegistration);
        verify(channelRegistration).interceptors(captor.capture());
        return captor.getValue();
    }

    @Test
    void testConnectWithValidWebSocketTicketAuthenticatesUser() {
        ChannelInterceptor interceptor = captureInterceptor();

        when(webSocketTicketService.validateAndConsumeTicket("valid-ticket-123")).thenReturn(Optional.of("john_doe"));
        User userDetails = new User("john_doe", "password", Collections.singletonList(new SimpleGrantedAuthority("USER")));
        when(userDetailsService.loadUserByUsername("john_doe")).thenReturn(userDetails);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        accessor.setNativeHeader("X-WS-Ticket", "valid-ticket-123");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, messageChannel);
        assertNotNull(result);

        StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
        assertNotNull(resultAccessor.getUser());
        assertEquals("john_doe", resultAccessor.getUser().getName());
    }

    @Test
    void testConnectWithInvalidTicketFallsBackToJwt() {
        ChannelInterceptor interceptor = captureInterceptor();

        when(webSocketTicketService.validateAndConsumeTicket("expired-ticket")).thenReturn(Optional.empty());
        when(jwtUtils.validateJwtToken("valid-jwt")).thenReturn(true);
        when(jwtBlacklistService.isBlacklisted("valid-jwt")).thenReturn(false);
        when(jwtUtils.getUserNameFromJwtToken("valid-jwt")).thenReturn("jwt_user");
        User userDetails = new User("jwt_user", "password", Collections.singletonList(new SimpleGrantedAuthority("USER")));
        when(userDetailsService.loadUserByUsername("jwt_user")).thenReturn(userDetails);

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        accessor.setNativeHeader("X-WS-Ticket", "expired-ticket");
        accessor.setNativeHeader("Authorization", "Bearer valid-jwt");
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = interceptor.preSend(message, messageChannel);
        assertNotNull(result);

        StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
        assertNotNull(resultAccessor.getUser());
        assertEquals("jwt_user", resultAccessor.getUser().getName());
    }

    @Test
    void testSubscribeUnauthenticatedThrowsAccessDenied() {
        ChannelInterceptor interceptor = captureInterceptor();

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/formations");
        // No user set
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(message, messageChannel));
    }

    @Test
    void testSubscribeAdminChannelNonAdminThrowsAccessDenied() {
        ChannelInterceptor interceptor = captureInterceptor();

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/audit");
        accessor.setUser(new UsernamePasswordAuthenticationToken("user", "pwd", List.of(new SimpleGrantedAuthority("USER"))));
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(message, messageChannel));
    }

    @Test
    void testSubscribeAdminChannelAdminAllowed() {
        ChannelInterceptor interceptor = captureInterceptor();

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/audit");
        accessor.setUser(new UsernamePasswordAuthenticationToken("admin", "pwd", List.of(new SimpleGrantedAuthority("ADMIN"))));
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertDoesNotThrow(() -> interceptor.preSend(message, messageChannel));
    }

    @Test
    void testSubscribePrivateNotificationsDifferentUserThrowsAccessDenied() {
        ChannelInterceptor interceptor = captureInterceptor();

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/notifications/alice");
        accessor.setUser(new UsernamePasswordAuthenticationToken("bob", "pwd", List.of(new SimpleGrantedAuthority("USER"))));
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertThrows(AccessDeniedException.class, () -> interceptor.preSend(message, messageChannel));
    }

    @Test
    void testSubscribePrivateNotificationsOwnerAllowed() {
        ChannelInterceptor interceptor = captureInterceptor();

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/notifications/alice");
        accessor.setUser(new UsernamePasswordAuthenticationToken("alice", "pwd", List.of(new SimpleGrantedAuthority("USER"))));
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        assertDoesNotThrow(() -> interceptor.preSend(message, messageChannel));
    }
}
