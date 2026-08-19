package org.springframework.samples.smartcheckin.company;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.audit.Auditable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/v1/companies")
@Tag(name = "Companies", description = "Endpoints for managing companies")
@SecurityRequirement(name = "bearerAuth")
@SuppressWarnings({"null", "java:S4684"})
public class CompanyRestController {

    private final CompanyService companyService;

    public CompanyRestController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<List<Company>> findAll() {
        return ResponseEntity.ok(companyService.findAll());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Company> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(companyService.findById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    @Auditable(action = "CREATE_COMPANY", details = "Creating new company")
    public ResponseEntity<Company> create(@Valid @RequestBody Company company) {
        Company created = companyService.save(company);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Auditable(action = "UPDATE_COMPANY", details = "Updating company")
    public ResponseEntity<Company> update(@PathVariable Integer id, @Valid @RequestBody Company company) {
        Company existing = companyService.findById(id);
        existing.setName(company.getName());
        existing.setDescription(company.getDescription());
        Company updated = companyService.save(existing);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    @Auditable(action = "DELETE_COMPANY", details = "Deleting company")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        companyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
