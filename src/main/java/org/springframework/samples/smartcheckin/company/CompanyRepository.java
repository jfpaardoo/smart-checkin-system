package org.springframework.samples.smartcheckin.company;

import java.util.List;
import java.util.Optional;
import org.springframework.data.repository.CrudRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

@Repository
public interface CompanyRepository extends CrudRepository<Company, Integer> {

    @Override
    @NonNull
    List<Company> findAll();

    Optional<Company> findByName(String name);
}
