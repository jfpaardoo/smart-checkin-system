package org.springframework.samples.smartcheckin.configuration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.StompWebSocketEndpointRegistration;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

    private WebSocketConfig webSocketConfig;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        webSocketConfig = new WebSocketConfig();
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
        verify(stompEndpointRegistry, org.mockito.Mockito.atLeastOnce()).addEndpoint("/ws");
    }

    @Test
    void testConfigureWebSocketTransport() {
        when(transportRegistration.setMessageSizeLimit(anyInt())).thenReturn(transportRegistration);
        when(transportRegistration.setSendBufferSizeLimit(anyInt())).thenReturn(transportRegistration);
        when(transportRegistration.setSendTimeLimit(anyInt())).thenReturn(transportRegistration);

        webSocketConfig.configureWebSocketTransport(transportRegistration);
        verify(transportRegistration).setMessageSizeLimit(10 * 1024 * 1024);
        verify(transportRegistration).setSendBufferSizeLimit(10 * 1024 * 1024);
        verify(transportRegistration).setSendTimeLimit(20 * 1000);
    }
}
