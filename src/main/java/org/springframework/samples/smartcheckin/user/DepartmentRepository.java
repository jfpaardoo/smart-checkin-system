package org.springframework.samples.smartcheckin.user;

import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentRepository extends CrudRepository<Department, Integer> {

    List<Department> findByParentDepartmentIsNull();
}
