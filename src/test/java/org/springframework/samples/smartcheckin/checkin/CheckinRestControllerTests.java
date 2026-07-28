package org.springframework.samples.smartcheckin.checkin;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.samples.smartcheckin.configuration.SecurityConfiguration;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserService;
import org.springframework.samples.smartcheckin.formation.FormationService;
import org.springframework.samples.smartcheckin.totp.TotpService;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;

@SuppressWarnings("null")
@WebMvcTest(controllers = CheckinRestController.class, 
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), 
    excludeAutoConfiguration = SecurityConfiguration.class)
class CheckinRestControllerTests {

    private static final String BASE_URL = "/api/v1/checkins";
    private static final Integer TEST_USER_ID = 1;
    private static final Integer TEST_CHECKIN_ID = 100;

    @MockitoBean
    private CheckinService checkInService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private TotpService totpService;

    @MockitoBean
    private FormationService formationService;

    @MockitoBean
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MockMvc mockMvc;

    private Checkin dummyCheckin;

    @BeforeEach
    void setUp() {
        User localUser = new User();
        localUser.setId(TEST_USER_ID);
        localUser.setUsername("worker1");
        localUser.setIsWorking(false);

        dummyCheckin = new Checkin();
        dummyCheckin.setId(TEST_CHECKIN_ID);
        dummyCheckin.setCheckInDate(LocalDateTime.now(ZoneId.systemDefault()));
        dummyCheckin.setCheckInType(CheckinType.ENTRADA);
        dummyCheckin.setUser(localUser);

        when(userService.findCurrentUser()).thenReturn(localUser);
    }

    @Test
    @WithMockUser(username = "worker1", authorities = {"USER"})
    void shouldRegisterCheckInSuccessfully() throws Exception {
        CheckinRequest request = new CheckinRequest();
        request.setCheckInType(CheckinType.ENTRADA);

        when(checkInService.performCheckIn(any(User.class), any(CheckinType.class))).thenReturn(dummyCheckin);

        mockMvc.perform(post(BASE_URL)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(TEST_CHECKIN_ID))
                .andExpect(jsonPath("$.checkInType").value("ENTRADA"));
                
        verify(checkInService).performCheckIn(any(User.class), any(CheckinType.class));
    }

    @Test
    @WithMockUser(username = "worker1", authorities = {"USER"})
    void shouldNotRegisterCheckInWhenTypeIsMissing() throws Exception {
        CheckinRequest request = new CheckinRequest();

        mockMvc.perform(post(BASE_URL)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
                
        verify(checkInService, never()).performCheckIn(any(), any());
    }

    @Test
    @WithMockUser(username = "worker1", authorities = {"USER"})
    void shouldGetMyHistorySuccessfully() throws Exception {
        when(checkInService.findByUserId(TEST_USER_ID)).thenReturn(List.of(dummyCheckin));

        mockMvc.perform(get(BASE_URL + "/my-history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(1))
                .andExpect(jsonPath("$[0].id").value(TEST_CHECKIN_ID))
                .andExpect(jsonPath("$[0].checkInType").value("ENTRADA"));
                
        verify(checkInService).findByUserId(TEST_USER_ID);
    }
}