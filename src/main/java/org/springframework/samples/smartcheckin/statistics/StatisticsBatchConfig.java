package org.springframework.samples.smartcheckin.statistics;

import java.time.LocalDate;
import java.time.ZoneId;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.job.builder.JobBuilder;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.step.builder.StepBuilder;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.lang.NonNull;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;

@Configuration
public class StatisticsBatchConfig {

    private static final Logger logger = LoggerFactory.getLogger(StatisticsBatchConfig.class);

    @Bean
    public Job statisticsJob(@NonNull JobRepository jobRepository, @NonNull Step calculateStatisticsStep) {
        return new JobBuilder("statisticsJob", jobRepository)
                .start(calculateStatisticsStep)
                .build();
    }

    @Bean
    public Step calculateStatisticsStep(@NonNull JobRepository jobRepository, @NonNull PlatformTransactionManager transactionManager, StatisticsRepository statisticsRepository, CheckinRepository checkinRepository, JdbcTemplate jdbcTemplate) {
        return new StepBuilder("calculateStatisticsStep", jobRepository)
                .tasklet(statisticsTasklet(statisticsRepository, checkinRepository, jdbcTemplate), transactionManager)
                .build();
    }

    @Bean
    @NonNull
    public Tasklet statisticsTasklet(StatisticsRepository statisticsRepository, CheckinRepository checkinRepository, JdbcTemplate jdbcTemplate) {
        return (contribution, chunkContext) -> {
            LocalDate today = LocalDate.now(ZoneId.systemDefault());
            logger.info("Executing Spring Batch tasklet to calculate statistics for {}", today);

            // Get real data from database
            Long totalCheckins = checkinRepository.count();
            
            // Active formations (formation_date is in the future or null)
            Long activeFormations = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM formations WHERE formation_date > CURRENT_TIMESTAMP OR formation_date IS NULL", Long.class);

            // Average working hours from checkins table (Postgres epoch extraction)
            Double avgHours = 0.0;
            try {
                // Cannot calculate average hours as checkins only store a single timestamp (check_in_date)
                avgHours = 0.0;
            } catch (Exception e) {
                logger.warn("Could not compute average hours: {}", e.getMessage());
            }

            PlatformStatistic stat = statisticsRepository.findFirstByDate(today).orElse(new PlatformStatistic());
            stat.setDate(today);
            stat.setTotalCheckins(totalCheckins);
            stat.setActiveFormations(activeFormations);
            stat.setAverageHoursPerEmployee(avgHours != null ? Math.round(avgHours * 100.0) / 100.0 : 0.0);
            stat.setFormationAttendanceRate(100.0); // Static placeholder for now
            
            statisticsRepository.save(stat);
            logger.info("Saved platform statistics");

            return RepeatStatus.FINISHED;
        };
    }
}
