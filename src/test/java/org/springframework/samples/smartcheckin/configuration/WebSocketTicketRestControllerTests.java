package org.springframework.samples.smartcheckin.configuration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SuppressWarnings("null")
@WebMvcTest(controllers = WebSocketTicketRestController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = SecurityConfiguration.class)
class WebSocketTicketRestControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WebSocketTicketService webSocketTicketService;

    @Test
    @WithMockUser(username = "alice")
    void testRequestTicketAuthenticatedReturnsTicket() throws Exception {
        when(webSocketTicketService.generateTicket("alice")).thenReturn("random-ticket-token-abc");

        mockMvc.perform(post("/api/v1/ws/ticket").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ticket").value("random-ticket-token-abc"))
                .andExpect(jsonPath("$.expiresIn").value(60));
    }
}
