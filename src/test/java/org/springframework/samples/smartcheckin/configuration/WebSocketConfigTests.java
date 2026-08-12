package org.springframework.samples.smartcheckin.configuration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
class WebSocketConfigTests {

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

    private Message<?> createMessage(StompCommand command, boolean authenticated) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        if (authenticated) {
            accessor.setUser(new UsernamePasswordAuthenticationToken("testuser", "password"));
        }
        accessor.setLeaveMutable(true);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }

    @Test
    void preSendConnectWithoutUserThrowsException() {
        Message<?> message = createMessage(StompCommand.CONNECT, false);
        
        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> 
            interceptor.preSend(message, messageChannel)
        );
        assertEquals("User not authenticated during WebSocket handshake", ex.getMessage());
    }

    @Test
    void preSendConnectWithUserDoesNotThrow() {
        Message<?> message = createMessage(StompCommand.CONNECT, true);
        
        Message<?> result = interceptor.preSend(message, messageChannel);
        assertNotNull(result);
        
        StompHeaderAccessor accessor = StompHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);
        assertNotNull(accessor.getUser());
        assertEquals("testuser", accessor.getUser().getName());
    }

    @Test
    void preSendNonConnectCommandIgnoresAuth() {
        Message<?> message = createMessage(StompCommand.SUBSCRIBE, false);
        
        Message<?> result = interceptor.preSend(message, messageChannel);
        assertNotNull(result);
    }
}
