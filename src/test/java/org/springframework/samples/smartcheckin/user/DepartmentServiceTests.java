package org.springframework.samples.smartcheckin.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class DepartmentServiceTests {

    private static final String ENGINEERING = "Engineering";

    @Mock
    private DepartmentRepository departmentRepository;

    @InjectMocks
    private DepartmentService departmentService;

    private Department dept;

    @BeforeEach
    void setUp() {
        dept = new Department();
        dept.setId(1);
        dept.setName(ENGINEERING);
    }

    // ─── getAllDepartments ────────────────────────────────────────────────────

    @Test
    void testGetAllDepartmentsReturnsAllDepartments() {
        when(departmentRepository.findAll()).thenReturn(List.of(dept));
        List<Department> result = departmentService.getAllDepartments();
        assertEquals(1, result.size());
        assertEquals(ENGINEERING, result.get(0).getName());
    }

    @Test
    void testGetAllDepartmentsEmptyRepositoryReturnsEmptyList() {
        when(departmentRepository.findAll()).thenReturn(List.of());
        assertTrue(departmentService.getAllDepartments().isEmpty());
    }

    // ─── getRootDepartments ───────────────────────────────────────────────────

    @Test
    void testGetRootDepartmentsReturnsOnlyRootDepartments() {
        when(departmentRepository.findByParentDepartmentIsNull()).thenReturn(List.of(dept));
        List<Department> result = departmentService.getRootDepartments();
        assertEquals(1, result.size());
        assertNull(result.get(0).getParentDepartment());
    }

    @Test
    void testGetRootDepartmentsNoRootDeptsReturnsEmptyList() {
        when(departmentRepository.findByParentDepartmentIsNull()).thenReturn(List.of());
        assertTrue(departmentService.getRootDepartments().isEmpty());
    }

    // ─── getDepartmentById ────────────────────────────────────────────────────

    @Test
    void testGetDepartmentByIdExistingReturnsPresent() {
        when(departmentRepository.findById(1)).thenReturn(Optional.of(dept));
        Optional<Department> result = departmentService.getDepartmentById(1);
        assertTrue(result.isPresent());
        assertEquals(ENGINEERING, result.get().getName());
    }

    @Test
    void testGetDepartmentByIdNotFoundReturnsEmpty() {
        when(departmentRepository.findById(99)).thenReturn(Optional.empty());
        assertTrue(departmentService.getDepartmentById(99).isEmpty());
    }

    // ─── saveDepartment ───────────────────────────────────────────────────────

    @Test
    void testSaveDepartmentPersistsAndReturns() {
        when(departmentRepository.save(dept)).thenReturn(dept);
        Department saved = departmentService.saveDepartment(dept);
        assertSame(dept, saved);
        verify(departmentRepository).save(dept);
    }

    // ─── deleteDepartment ─────────────────────────────────────────────────────

    @Test
    void testDeleteDepartmentCallsRepositoryDelete() {
        departmentService.deleteDepartment(1);
        verify(departmentRepository).deleteById(1);
    }
}
