package org.springframework.samples.smartcheckin.statistics;

import static org.mockito.Mockito.*;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.samples.smartcheckin.exports.EmailService;
import org.springframework.samples.smartcheckin.exports.PdfReportGenerator;
import org.springframework.samples.smartcheckin.formation.FormationRepository;
import org.springframework.samples.smartcheckin.user.UserRepository;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class StatisticsSchedulerTests {

    @Mock
    private JobLauncher jobLauncher;

    @Mock
    private Job statisticsJob;

    @Mock
    private EmailService emailService;

    @Mock
    private PdfReportGenerator pdfReportGenerator;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FormationRepository formationRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private StatisticsScheduler statisticsScheduler;

    @Test
    void shouldRunJob() throws Exception {
        statisticsScheduler.runJob();
        verify(jobLauncher, times(1)).run(eq(statisticsJob), any());
    }

    @Test
    void shouldSendHrReport() {
        when(userRepository.count()).thenReturn(10L);
        when(formationRepository.count()).thenReturn(5L);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(2);
        
        when(pdfReportGenerator.generateHrReportPdf(10, 5, 2, 2)).thenReturn(new byte[]{1, 2});

        statisticsScheduler.sendHrReport();

        verify(emailService, times(1)).sendEmailWithAttachment(
            eq("hr-manager@baglass.com"),
            anyString(),
            anyString(),
            any(byte[].class),
            eq("HR_Report.pdf")
        );
    }

    @Test
    void shouldSendHrReportWithNullQueryResults() {
        when(userRepository.count()).thenReturn(10L);
        when(formationRepository.count()).thenReturn(5L);
        when(jdbcTemplate.queryForObject(anyString(), eq(Integer.class))).thenReturn(null);
        
        when(pdfReportGenerator.generateHrReportPdf(10, 5, 0, 0)).thenReturn(new byte[]{1, 2});

        statisticsScheduler.sendHrReport();

        verify(emailService, times(1)).sendEmailWithAttachment(
            eq("hr-manager@baglass.com"),
            anyString(),
            anyString(),
            any(byte[].class),
            eq("HR_Report.pdf")
        );
    }

    @Test
    void shouldHandleExceptionWhenSendingHrReport() {
        when(userRepository.count()).thenThrow(new RuntimeException("Database error"));
        
        statisticsScheduler.sendHrReport();
        
        verify(emailService, never()).sendEmailWithAttachment(anyString(), anyString(), anyString(), any(), anyString());
    }
}
