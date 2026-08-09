package org.springframework.samples.smartcheckin.statistics;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.batch.core.Job;
import org.springframework.batch.core.Step;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.repository.JobRepository;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class StatisticsBatchConfigTests {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private PlatformTransactionManager transactionManager;

    @Mock
    private StatisticsRepository statisticsRepository;

    @Mock
    private CheckinRepository checkinRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private StatisticsBatchConfig batchConfig;

    @BeforeEach
    void setUp() {
        batchConfig = new StatisticsBatchConfig();
    }

    @Test
    void shouldExecuteTaskletSuccessfully() throws Exception {
        Tasklet tasklet = batchConfig.statisticsTasklet(statisticsRepository, checkinRepository, jdbcTemplate);
        
        when(checkinRepository.count()).thenReturn(15L);
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class))).thenReturn(5L);

        when(statisticsRepository.findFirstByDate(any(LocalDate.class))).thenReturn(Optional.of(new PlatformStatistic()));
        
        StepContribution contribution = mock(StepContribution.class);
        ChunkContext chunkContext = mock(ChunkContext.class);

        RepeatStatus status = tasklet.execute(contribution, chunkContext);

        assertEquals(RepeatStatus.FINISHED, status);
        verify(statisticsRepository, times(1)).save(any(PlatformStatistic.class));
    }
    
    @Test
    void shouldExecuteTaskletWhenStatisticNotFound() throws Exception {
        Tasklet tasklet = batchConfig.statisticsTasklet(statisticsRepository, checkinRepository, jdbcTemplate);
        
        when(checkinRepository.count()).thenReturn(15L);
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class))).thenReturn(5L);

        // Fuerza la rama orElse(new PlatformStatistic())
        when(statisticsRepository.findFirstByDate(any(LocalDate.class))).thenReturn(Optional.empty());
        
        StepContribution contribution = mock(StepContribution.class);
        ChunkContext chunkContext = mock(ChunkContext.class);

        RepeatStatus status = tasklet.execute(contribution, chunkContext);

        assertEquals(RepeatStatus.FINISHED, status);
        verify(statisticsRepository, times(1)).save(any(PlatformStatistic.class));
    }

    @Test
    void shouldExecuteTaskletWithExceptionInQuery() throws Exception {
        Tasklet tasklet = batchConfig.statisticsTasklet(statisticsRepository, checkinRepository, jdbcTemplate);
        
        when(checkinRepository.count()).thenReturn(15L);
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class))).thenReturn(5L);

        when(statisticsRepository.findFirstByDate(any(LocalDate.class))).thenThrow(new RuntimeException("Database Timeout"));
        
        StepContribution contribution = mock(StepContribution.class);
        ChunkContext chunkContext = mock(ChunkContext.class);

        // Verificamos que el tasklet maneja la excepción del repositorio o finaliza de forma controlada
        Exception exception = assertThrows(Exception.class, () -> tasklet.execute(contribution, chunkContext));

        assertNotNull(exception);
    }

    @Test
    void testBatchJobAndStepBeansCreation() {
        Step step = batchConfig.calculateStatisticsStep(jobRepository, transactionManager, statisticsRepository, checkinRepository, jdbcTemplate);
        assertNotNull(step);

        Job job = batchConfig.statisticsJob(jobRepository, step);
        assertNotNull(job);
    }

    @Test
    void shouldExecuteTaskletCatchingExceptionInTryBlock() {

        Tasklet tasklet = batchConfig.statisticsTasklet(
                statisticsRepository,
                checkinRepository,
                jdbcTemplate);

        when(checkinRepository.count()).thenReturn(10L);

        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class)))
                .thenThrow(new RuntimeException("JDBC Error"));

        StepContribution contribution = mock(StepContribution.class);
        ChunkContext chunkContext = mock(ChunkContext.class);

        assertThrows(RuntimeException.class,
                () -> tasklet.execute(contribution, chunkContext));

        verify(statisticsRepository, never()).save(any());
}
}