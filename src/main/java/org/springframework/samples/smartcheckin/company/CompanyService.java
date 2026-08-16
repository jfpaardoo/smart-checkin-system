package org.springframework.samples.smartcheckin.company;

import java.util.List;
import org.springframework.lang.NonNull;
import org.springframework.samples.smartcheckin.exceptions.ResourceNotFoundException;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyService {

    private static final String COMPANY_RESOURCE = "Company";

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public CompanyService(CompanyRepository companyRepository, UserRepository userRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Company> findAll() {
        return companyRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Company findById(@NonNull Integer id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(COMPANY_RESOURCE, "id", id));
    }

    @Transactional(readOnly = true)
    public Company findByName(String name) {
        return companyRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException(COMPANY_RESOURCE, "name", name));
    }

    @Transactional
    public Company save(@NonNull Company company) {
        return companyRepository.save(company);
    }

    @Transactional
    public void delete(@NonNull Integer id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(COMPANY_RESOURCE, "id", id));
        List<User> associatedUsers = userRepository.findByCompanyId(company.getId());
        if (associatedUsers != null && !associatedUsers.isEmpty()) {
            for (User user : associatedUsers) {
                user.setCompany(null);
            }
            userRepository.saveAll(associatedUsers);
        }
        companyRepository.delete(company);
    }
}
