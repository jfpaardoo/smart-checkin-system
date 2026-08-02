package org.springframework.samples.smartcheckin.statistics;

import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobExecutionException;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.samples.smartcheckin.exports.EmailService;
import org.springframework.samples.smartcheckin.exports.PdfReportGenerator;
import org.springframework.samples.smartcheckin.user.UserRepository;
import org.springframework.samples.smartcheckin.formation.FormationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;

@Component
@EnableScheduling
public class StatisticsScheduler {
    private static final Logger logger = LoggerFactory.getLogger(StatisticsScheduler.class);

    private final JobLauncher jobLauncher;
    @NonNull private final Job statisticsJob;
    private final EmailService emailService;
    private final PdfReportGenerator pdfReportGenerator;
    private final UserRepository userRepository;
    private final FormationRepository formationRepository;
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public StatisticsScheduler(@NonNull JobLauncher jobLauncher, @NonNull Job statisticsJob,
                               EmailService emailService, PdfReportGenerator pdfReportGenerator,
                               UserRepository userRepository, FormationRepository formationRepository,
                               JdbcTemplate jdbcTemplate) {
        this.jobLauncher = jobLauncher;
        this.statisticsJob = statisticsJob;
        this.emailService = emailService;
        this.pdfReportGenerator = pdfReportGenerator;
        this.userRepository = userRepository;
        this.formationRepository = formationRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    // Run every hour
    @Scheduled(fixedRate = 3600000)
    public void runJob() throws JobExecutionException {
        jobLauncher.run(statisticsJob, new JobParametersBuilder()
                .addLong("time", System.currentTimeMillis())
                .toJobParameters());
    }

    // Run every Friday at 18:00 (for demo: every 12 hours)
    // Here we will use a fixed rate of 12 hours for demo purposes
    @Scheduled(fixedRate = 43200000)
    public void sendHrReport() {
        try {
            logger.info("Generating and sending HR Report...");
            int totalUsers = (int) userRepository.count();
            int totalFormations = (int) formationRepository.count();
            
            Integer activeCheckins = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM checkins WHERE check_in_type = 'ENTRADA'", Integer.class);
            Integer checkinsToday = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM checkins WHERE check_in_date >= CURRENT_DATE", Integer.class);

            byte[] pdf = pdfReportGenerator.generateHrReportPdf(totalUsers, totalFormations, 
                            activeCheckins != null ? activeCheckins : 0, 
                            checkinsToday != null ? checkinsToday : 0);
            
            emailService.sendEmailWithAttachment(
                "hr-manager@baglass.com", // dummy HR email
                "Reporte Ejecutivo RRHH - BA Glass",
                "Adjunto encontrará el reporte ejecutivo semanal de Recursos Humanos.",
                pdf,
                "HR_Report.pdf"
            );
            logger.info("HR Report sent successfully.");
        } catch (Exception e) {
            logger.error("Failed to generate/send HR report", e);
        }
    }
}
