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

@Component
@EnableScheduling
public class StatisticsScheduler {

    private final JobLauncher jobLauncher;
    @NonNull private final Job statisticsJob;

    @Autowired
    public StatisticsScheduler(@NonNull JobLauncher jobLauncher, @NonNull Job statisticsJob) {
        this.jobLauncher = jobLauncher;
        this.statisticsJob = statisticsJob;
    }

    // Run every hour
    @Scheduled(fixedRate = 3600000)
    public void runJob() throws JobExecutionException {
        jobLauncher.run(statisticsJob, new JobParametersBuilder()
                .addLong("time", System.currentTimeMillis())
                .toJobParameters());
    }
}
