package org.springframework.samples.smartcheckin.user;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import org.springframework.lang.NonNull;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "departments")
    public List<Department> getAllDepartments() {
        return (List<Department>) departmentRepository.findAll();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "departments", key = "'root'")
    public List<Department> getRootDepartments() {
        return departmentRepository.findByParentDepartmentIsNull();
    }

    @Transactional(readOnly = true)
    public Optional<Department> getDepartmentById(@NonNull Integer id) {
        return departmentRepository.findById(id);
    }

    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public Department saveDepartment(@NonNull Department department) {
        return departmentRepository.save(department);
    }

    @Transactional
    @CacheEvict(value = "departments", allEntries = true)
    public void deleteDepartment(@NonNull Integer id) {
        departmentRepository.deleteById(id);
    }
}
