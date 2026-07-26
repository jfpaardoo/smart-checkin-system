package org.springframework.samples.petclinic.checkin;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.samples.petclinic.configuration.SecurityConfiguration;
import org.springframework.samples.petclinic.user.User;
import org.springframework.samples.petclinic.user.UserService;
import org.springframework.samples.petclinic.totp.TotpService;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(controllers = CheckinRestController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = SecurityConfiguration.class)
@SuppressWarnings("null")
class CheckinRestControllerTests {

    private static final String BASE_URL = "/api/v1/checkins";

    @MockitoBean
    private CheckinService checkInService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private TotpService totpService;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MockMvc mockMvc;

    private User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1);
        currentUser.setUsername("worker1");
        currentUser.setIsWorking(false);

        when(userService.findCurrentUser()).thenReturn(currentUser);
    }

    @Test
    @WithMockUser("worker1")
    void shouldRegisterCheckIn() throws Exception {
        CheckinRequest request = new CheckinRequest();
        request.setCheckInType(CheckinType.ENTRADA);

        Checkin checkin = new Checkin();
        checkin.setId(1);
        checkin.setCheckInDate(LocalDateTime.now());
        checkin.setCheckInType(CheckinType.ENTRADA);
        checkin.setUser(currentUser);

        when(checkInService.performCheckIn(any(User.class), any(CheckinType.class))).thenReturn(checkin);

        mockMvc.perform(post(BASE_URL)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.checkInType").value("ENTRADA"));
    }

    @Test
    @WithMockUser("worker1")
    void shouldGetMyHistory() throws Exception {
        Checkin checkIn = new Checkin();
        checkIn.setId(1);
        checkIn.setCheckInDate(LocalDateTime.now());
        checkIn.setCheckInType(CheckinType.ENTRADA);
        checkIn.setUser(currentUser);

        when(checkInService.findByUserId(currentUser.getId())).thenReturn(List.of(checkIn));

        mockMvc.perform(get(BASE_URL + "/my-history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].checkInType").value("ENTRADA"));
    }
}
