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

	@MockitoBean
	private AuditLogRepository auditLogRepository;

	@Autowired
	private MockMvc mockMvc;

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testGetAuditLogs() throws Exception {
		AuditLog log = new AuditLog("USER_SAVE", "user1", "details", "127.0.0.1");
		when(auditLogRepository.findAllByOrderByTimestampDesc()).thenReturn(List.of(log));

		mockMvc.perform(get(BASE_URL)).andExpect(status().isOk());
	}

	@Test
	@WithMockUser(authorities = {"ADMIN"})
	void testExportAuditCsv() throws Exception {
		AuditLog log = new AuditLog("USER_SAVE", "user1", "details", "127.0.0.1");
		when(auditLogRepository.findAllByOrderByTimestampDesc()).thenReturn(List.of(log));

		mockMvc.perform(get(BASE_URL + "/csv")).andExpect(status().isOk());
	}
}
