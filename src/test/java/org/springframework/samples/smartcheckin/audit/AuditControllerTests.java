package org.springframework.samples.smartcheckin.audit;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.samples.smartcheckin.configuration.SecurityConfiguration;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = AuditController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = SecurityConfiguration.class)
class AuditControllerTests {

	private static final String BASE_URL = "/api/v1/audit";
	private static final String TEST_DETAILS = "details";
	private static final String TEST_IP = "127.0.0.1";

	@MockitoBean
	private AuditLogRepository auditLogRepository;

	@MockitoBean
	private AuditService auditService;

	@Autowired
	private MockMvc mockMvc;

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testGetAuditLogs() throws Exception {
		AuditLog log = new AuditLog("USER_SAVE", "user1", TEST_DETAILS, TEST_IP);
		when(auditLogRepository.findAllByOrderByTimestampDesc()).thenReturn(List.of(log));

		mockMvc.perform(get(BASE_URL)).andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testVerifyIntegrity() throws Exception {
		when(auditService.verifyIntegrity()).thenReturn(new AuditIntegrityResult(true, null, "All logs verified", 5));

		mockMvc.perform(get(BASE_URL + "/verify-integrity")).andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testExportAuditCsv() throws Exception {
		AuditLog log = new AuditLog("USER_SAVE", "user1", TEST_DETAILS, TEST_IP);
		when(auditLogRepository.findAllByOrderByTimestampDesc()).thenReturn(List.of(log));
		mockMvc.perform(get(BASE_URL + "/csv")).andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testExportAuditCsvWithNullFields() throws Exception {
		AuditLog log = new AuditLog(null, null, null, null);
		when(auditLogRepository.findAllByOrderByTimestampDesc()).thenReturn(List.of(log));
		mockMvc.perform(get(BASE_URL + "/csv")).andExpect(status().isOk());
	}

	@Test
    @WithMockUser(authorities = {"ADMIN"})
    void testExportAuditCsvWithExplicitNullTimestamp() throws Exception {
        AuditLog log = new AuditLog("LOGIN", "admin", TEST_DETAILS, TEST_IP);
        log.setTimestamp(null); // Fuerza explícitamente el valor nulo para evaluar la rama del ternario

        when(auditLogRepository.findAllByOrderByTimestampDesc()).thenReturn(List.of(log));

        mockMvc.perform(get(BASE_URL + "/csv")).andExpect(status().isOk());
    }
}

