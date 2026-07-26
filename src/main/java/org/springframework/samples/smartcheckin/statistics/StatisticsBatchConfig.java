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

            // Dummy implementation for metrics, realistically we would query the database
            Long totalCheckins = checkinRepository.count();
            
            // e.g. Count active formations
            Long activeFormations = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM formations", Long.class);

            PlatformStatistic stat = statisticsRepository.findByDate(today).orElse(new PlatformStatistic());
            stat.setDate(today);
            stat.setTotalCheckins(totalCheckins);
            stat.setActiveFormations(activeFormations);
            stat.setAverageHoursPerEmployee(8.0); // Dummy for now
            stat.setFormationAttendanceRate(95.0); // Dummy for now
            
            statisticsRepository.save(stat);
            logger.info("Saved platform statistics");

            return RepeatStatus.FINISHED;
        };
    }
}
