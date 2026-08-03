package org.springframework.samples.smartcheckin.totp;

import static org.mockito.Mockito.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Map;

@SuppressWarnings("null")
class TotpBroadcastServiceTests {

    private static final String LAST_TOKEN_FIELD = "lastBroadcastedToken";
    private static final String TOKEN_VAL = "TOKEN123";

    @Mock
    private TotpService totpService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private TotpBroadcastService totpBroadcastService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testBroadcastTokenIfChangedNullToken() {
        when(totpService.getCurrentToken()).thenReturn(null);
        totpBroadcastService.broadcastTokenIfChanged();
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Map.class));
    }

    @Test
    void testBroadcastTokenIfChangedSameToken() {
        ReflectionTestUtils.setField(totpBroadcastService, LAST_TOKEN_FIELD, TOKEN_VAL);
        when(totpService.getCurrentToken()).thenReturn(TOKEN_VAL);
        totpBroadcastService.broadcastTokenIfChanged();
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Map.class));
    }

    @Test
    void testBroadcastTokenIfChangedDifferentToken() {
        ReflectionTestUtils.setField(totpBroadcastService, LAST_TOKEN_FIELD, TOKEN_VAL);
        when(totpService.getCurrentToken()).thenReturn("TOKEN456");
        totpBroadcastService.broadcastTokenIfChanged();
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/totp"), any(Map.class));
        assert "TOKEN456".equals(ReflectionTestUtils.getField(totpBroadcastService, LAST_TOKEN_FIELD));
    }

    @Test
    void testBroadcastTokenIfChangedException() {
        when(totpService.getCurrentToken()).thenThrow(new RuntimeException("Simulated exception"));
        // Method catches exception and logs it, should not propagate
        totpBroadcastService.broadcastTokenIfChanged();
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Map.class));
    }
}
