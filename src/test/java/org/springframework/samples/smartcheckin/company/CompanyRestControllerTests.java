package org.springframework.samples.smartcheckin.company;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.samples.smartcheckin.configuration.SecurityConfiguration;
import org.springframework.security.config.annotation.web.WebSecurityConfigurer;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = CompanyRestController.class, excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = WebSecurityConfigurer.class), excludeAutoConfiguration = SecurityConfiguration.class)
@SuppressWarnings("null")
class CompanyRestControllerTests {

    private static final String BASE_URL = "/api/v1/companies";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CompanyService companyService;

    @Test
    @WithMockUser
    void shouldFindAllCompanies() throws Exception {
        Company c1 = Company.builder().name("BA Glass").build();
        c1.setId(1);
        Company c2 = Company.builder().name("OT Noriega").build();
        c2.setId(2);

        when(companyService.findAll()).thenReturn(List.of(c1, c2));

        mockMvc.perform(get(BASE_URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size()").value(2))
                .andExpect(jsonPath("$[0].name").value("BA Glass"))
                .andExpect(jsonPath("$[1].name").value("OT Noriega"));
    }

    private static final String JSON_NAME = "$.name";

    @Test
    @WithMockUser(authorities = "ADMIN")
    void shouldFindCompanyById() throws Exception {
        Company c = Company.builder().name("Eurotalia").build();
        c.setId(3);

        when(companyService.findById(3)).thenReturn(c);

        mockMvc.perform(get(BASE_URL + "/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath(JSON_NAME).value("Eurotalia"));
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void shouldCreateCompany() throws Exception {
        Company c = Company.builder().name("New Company").build();
        c.setId(10);

        when(companyService.save(any(Company.class))).thenReturn(c);

        mockMvc.perform(post(BASE_URL)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(c)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath(JSON_NAME).value("New Company"));
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void shouldUpdateCompany() throws Exception {
        Company existing = Company.builder().name("Old Name").build();
        existing.setId(1);

        Company updated = Company.builder().name("Updated Name").build();
        updated.setId(1);

        when(companyService.findById(1)).thenReturn(existing);
        when(companyService.save(any(Company.class))).thenReturn(updated);

        mockMvc.perform(put(BASE_URL + "/1")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updated)))
                .andExpect(status().isOk())
                .andExpect(jsonPath(JSON_NAME).value("Updated Name"));
    }

    @Test
    @WithMockUser(authorities = "ADMIN")
    void shouldDeleteCompany() throws Exception {
        doNothing().when(companyService).delete(1);

        mockMvc.perform(delete(BASE_URL + "/1").with(csrf()))
                .andExpect(status().isNoContent());

        verify(companyService, times(1)).delete(1);
    }
}
