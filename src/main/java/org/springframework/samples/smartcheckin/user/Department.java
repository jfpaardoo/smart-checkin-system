package org.springframework.samples.smartcheckin.user;

import java.util.ArrayList;
import java.util.List;

import org.springframework.samples.smartcheckin.model.BaseEntity;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;

@Getter
@Setter
@EqualsAndHashCode(callSuper = false, exclude = {"subDepartments", "employees"})
@Entity
@Table(name = "departments")
public class Department extends BaseEntity implements OrganizationalUnit {

    @NotBlank
    @Size(min = 1, max = 255)
    private String name;

    @ManyToOne
    @JoinColumn(name = "parent_department_id")
    @JsonIgnore
    private Department parentDepartment;

    @OneToMany(mappedBy = "parentDepartment", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Department> subDepartments = new ArrayList<>();

    @OneToMany(mappedBy = "department")
    @JsonIgnore
    private List<User> employees = new ArrayList<>();

    @Override
    public int getTotalEmployees() {
        int count = employees.size();
        for (Department sub : subDepartments) {
            count += sub.getTotalEmployees();
        }
        return count;
    }

    @Override
    public int getCurrentlyWorkingCount() {
        int count = 0;
        for (User emp : employees) {
            count += emp.getCurrentlyWorkingCount();
        }
        for (Department sub : subDepartments) {
            count += sub.getCurrentlyWorkingCount();
        }
        return count;
    }
}
