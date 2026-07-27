package org.springframework.samples.smartcheckin.statistics;

import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

public interface StatisticsRepository extends CrudRepository<PlatformStatistic, Integer> {

    Optional<PlatformStatistic> findFirstByDate(LocalDate date);

    Optional<PlatformStatistic> findByDate(LocalDate date);

    @Query("SELECT p FROM PlatformStatistic p ORDER BY p.date DESC LIMIT 30")
    List<PlatformStatistic> findLast30Days();

}
