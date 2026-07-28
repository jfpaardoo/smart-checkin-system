package org.springframework.samples.smartcheckin.settings;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CloudSettingsRepository extends CrudRepository<CloudSettings, Integer> {
}
