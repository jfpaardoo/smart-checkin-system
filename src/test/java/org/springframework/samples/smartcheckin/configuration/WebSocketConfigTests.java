package org.springframework.samples.smartcheckin.configuration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtBlacklistService;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtUtils;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsServiceImpl;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
class WebSocketConfigTests {

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private UserDetailsServiceImpl userDetailsService;

    @Mock
    private JwtBlacklistService jwtBlacklistService;

    @Mock
    private ChannelRegistration channelRegistration;

    @Mock
    private MessageChannel messageChannel;

    @InjectMocks
    private WebSocketConfig webSocketConfig;

    private ChannelInterceptor interceptor;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);

        ArgumentCaptor<ChannelInterceptor> captor = ArgumentCaptor.forClass(ChannelInterceptor.class);
        webSocketConfig.configureClientInboundChannel(channelRegistration);
        verify(channelRegistration).interceptors(captor.capture());
        interceptor = captor.getValue();
    }

    private Message<?> createMessage(StompCommand command, String authHeader) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        if (authHeader != null) {
            accessor.setNativeHeader("Authorization", authHeader);
        }
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    @Test
    void preSendConnectWithoutAuthHeaderThrowsException() {
        Message<?> message = createMessage(StompCommand.CONNECT, null);
        
        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> 
            interceptor.preSend(message, messageChannel)
        );
        assertEquals("Missing JWT Token", ex.getMessage());
    }

    @Test
    void preSendConnectWithInvalidFormatThrowsException() {
        Message<?> message = createMessage(StompCommand.CONNECT, "InvalidFormat");
        
        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> 
            interceptor.preSend(message, messageChannel)
        );
        assertEquals("Invalid JWT Token format", ex.getMessage());
    }

    @Test
    void preSendConnectWithInvalidJwtThrowsException() {
        Message<?> message = createMessage(StompCommand.CONNECT, "Bearer invalid-jwt");
        when(jwtUtils.validateJwtToken("invalid-jwt")).thenReturn(false);
        
        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> 
            interceptor.preSend(message, messageChannel)
        );
        assertEquals("Invalid JWT Token", ex.getMessage());
    }

    @Test
    void preSendConnectWithBlacklistedJwtThrowsException() {
        Message<?> message = createMessage(StompCommand.CONNECT, "Bearer valid-jwt");
        when(jwtUtils.validateJwtToken("valid-jwt")).thenReturn(true);
        when(jwtBlacklistService.isBlacklisted("valid-jwt")).thenReturn(true);
        
        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> 
            interceptor.preSend(message, messageChannel)
        );
        assertEquals("Token has been invalidated", ex.getMessage());
    }

    @Test
    void preSendConnectWithValidJwtSetsUser() {
        Message<?> message = createMessage(StompCommand.CONNECT, "Bearer valid-jwt");
        when(jwtUtils.validateJwtToken("valid-jwt")).thenReturn(true);
        when(jwtBlacklistService.isBlacklisted("valid-jwt")).thenReturn(false);
        when(jwtUtils.getUserNameFromJwtToken("valid-jwt")).thenReturn("testuser");
        
        UserDetails userDetails = new User("testuser", "password", Collections.emptyList());
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        
        Message<?> result = interceptor.preSend(message, messageChannel);
        assertNotNull(result);
        
        StompHeaderAccessor accessor = StompHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);
        Authentication auth = (Authentication) accessor.getUser();
        assertNotNull(auth);
        assertEquals("testuser", auth.getName());
    }

    @Test
    void preSendNonConnectCommandIgnoresAuth() {
        Message<?> message = createMessage(StompCommand.SUBSCRIBE, null);
        
        Message<?> result = interceptor.preSend(message, messageChannel);
        assertNotNull(result);
        
        verify(jwtUtils, never()).validateJwtToken(any());
    }
}
