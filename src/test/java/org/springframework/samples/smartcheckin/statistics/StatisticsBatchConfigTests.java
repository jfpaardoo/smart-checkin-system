package org.springframework.samples.smartcheckin.statistics;

import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.batch.core.StepContribution;
import org.springframework.batch.core.scope.context.ChunkContext;
import org.springframework.batch.core.step.tasklet.Tasklet;
import org.springframework.batch.repeat.RepeatStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class StatisticsBatchConfigTests {

    @Mock
    private StatisticsRepository statisticsRepository;

    @Mock
    private CheckinRepository checkinRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    @InjectMocks
    private StatisticsBatchConfig batchConfig;

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
    void shouldExecuteTaskletWithExceptionInQuery() throws Exception {
        Tasklet tasklet = batchConfig.statisticsTasklet(statisticsRepository, checkinRepository, jdbcTemplate);
        
        when(checkinRepository.count()).thenReturn(15L);
        when(jdbcTemplate.queryForObject(anyString(), eq(Long.class))).thenReturn(5L);

        when(statisticsRepository.findFirstByDate(any(LocalDate.class))).thenReturn(Optional.empty());
        
        StepContribution contribution = mock(StepContribution.class);
        ChunkContext chunkContext = mock(ChunkContext.class);

        RepeatStatus status = tasklet.execute(contribution, chunkContext);

        assertEquals(RepeatStatus.FINISHED, status);
        verify(statisticsRepository, times(1)).save(any(PlatformStatistic.class));
    }
}
