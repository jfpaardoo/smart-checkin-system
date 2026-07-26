package org.springframework.samples.smartcheckin.formation;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(value = FormationRestController.class, 
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), 
    excludeAutoConfiguration = { SecurityAutoConfiguration.class })
@SuppressWarnings("null")
class FormationRestControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private FormationService formationService;

    private AttendRequest attendRequest;

    @BeforeEach
    void setup() {
        attendRequest = new AttendRequest();
        attendRequest.setPersonalCode("1234");
    }

    @Test
    void shouldRegisterAttendance() throws Exception {
        doNothing().when(formationService).registerAttendance(anyInt(), anyString());

        mockMvc.perform(post("/api/v1/formations/1/attend")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(attendRequest)))
                .andExpect(status().isOk())
                .andExpect(content().string("Successfully registered attendance"));
    }

    @Test
    void shouldReturnBadRequestIfUserNotFound() throws Exception {
        doThrow(new IllegalArgumentException("User with given personal code not found"))
            .when(formationService).registerAttendance(anyInt(), anyString());

        mockMvc.perform(post("/api/v1/formations/1/attend")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(attendRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Failed to register: User with given personal code not found"));
    }
}
