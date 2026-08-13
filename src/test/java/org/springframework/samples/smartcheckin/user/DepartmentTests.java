package org.springframework.samples.smartcheckin.user;

import static org.junit.jupiter.api.Assertions.*;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

class DepartmentTests {

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private User workingUser() {
        User u = new User();
        u.setIsWorking(true);
        return u;
    }

    private User idleUser() {
        User u = new User();
        u.setIsWorking(false);
        return u;
    }

    private Department buildDept(String name, List<User> employees, List<Department> subs) {
        Department d = new Department();
        d.setName(name);
        d.setEmployees(employees);
        d.setSubDepartments(subs);
        return d;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // getTotalEmployees
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void getTotalEmployees_noSubDepts_countDirectEmployeesOnly() {
        Department dept = buildDept("HR", List.of(workingUser(), idleUser()), new ArrayList<>());
        assertEquals(2, dept.getTotalEmployees());
    }

    @Test
    void getTotalEmployees_emptyDept_returnsZero() {
        Department dept = buildDept("Empty", new ArrayList<>(), new ArrayList<>());
        assertEquals(0, dept.getTotalEmployees());
    }

    @Test
    void getTotalEmployees_withSubDepartments_recursiveCount() {
        // Parent has 2 employees, sub has 3
        Department sub = buildDept("Sub", List.of(workingUser(), idleUser(), workingUser()), new ArrayList<>());
        Department parent = buildDept("Parent", List.of(workingUser(), idleUser()), List.of(sub));
        assertEquals(5, parent.getTotalEmployees());
    }

    @Test
    void getTotalEmployees_deeplyNestedSubDepts_fullyRecursed() {
        // Level 3 has 1 employee, level 2 has 2, level 1 (root) has 1
        Department level3 = buildDept("L3", List.of(workingUser()), new ArrayList<>());
        Department level2 = buildDept("L2", List.of(workingUser(), idleUser()), List.of(level3));
        Department level1 = buildDept("L1", List.of(idleUser()), List.of(level2));
        assertEquals(4, level1.getTotalEmployees());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // getCurrentlyWorkingCount
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void getCurrentlyWorkingCount_noSubDepts_countsOnlyWorkingEmployees() {
        Department dept = buildDept("IT", List.of(workingUser(), idleUser(), workingUser()), new ArrayList<>());
        assertEquals(2, dept.getCurrentlyWorkingCount());
    }

    @Test
    void getCurrentlyWorkingCount_noWorkingEmployees_returnsZero() {
        Department dept = buildDept("Finance", List.of(idleUser(), idleUser()), new ArrayList<>());
        assertEquals(0, dept.getCurrentlyWorkingCount());
    }

    @Test
    void getCurrentlyWorkingCount_withSubDepartments_recursiveSum() {
        Department sub = buildDept("Sub", List.of(workingUser(), workingUser()), new ArrayList<>());
        Department parent = buildDept("Parent", List.of(workingUser(), idleUser()), List.of(sub));
        // parent: 1 working, sub: 2 working → total 3
        assertEquals(3, parent.getCurrentlyWorkingCount());
    }

    @Test
    void getCurrentlyWorkingCount_allWorking_returnsTotal() {
        Department sub = buildDept("Sub", List.of(workingUser()), new ArrayList<>());
        Department parent = buildDept("Parent", List.of(workingUser(), workingUser()), List.of(sub));
        assertEquals(3, parent.getCurrentlyWorkingCount());
    }

    @Test
    void getCurrentlyWorkingCount_nullIsWorking_treatedAsNotWorking() {
        User user = new User();
        user.setIsWorking(null);
        Department dept = buildDept("Null", List.of(user), new ArrayList<>());
        assertEquals(0, dept.getCurrentlyWorkingCount());
    }

    @Test
    void getCurrentlyWorkingCount_emptyDept_returnsZero() {
        Department dept = buildDept("Empty", new ArrayList<>(), new ArrayList<>());
        assertEquals(0, dept.getCurrentlyWorkingCount());
    }

    // ══════════════════════════════════════════════════════════════════════════
    // General Department properties
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    void setAndGetName_works() {
        Department dept = new Department();
        dept.setName("Operations");
        assertEquals("Operations", dept.getName());
    }

    @Test
    void setAndGetParentDepartment_works() {
        Department parent = new Department();
        parent.setName("Root");

        Department child = new Department();
        child.setName("Child");
        child.setParentDepartment(parent);

        assertSame(parent, child.getParentDepartment());
    }

    @Test
    void equalsAndHashCode_basedOnIdAndName() {
        Department d1 = new Department();
        d1.setId(1);
        d1.setName("HR");

        Department d2 = new Department();
        d2.setId(1);
        d2.setName("HR");

        assertEquals(d1, d2);
        assertEquals(d1.hashCode(), d2.hashCode());
    }
}
