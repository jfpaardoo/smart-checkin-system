package org.springframework.samples.petclinic.formation;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FormationRepository extends CrudRepository<Formation, Integer> {
    
}
