package org.springframework.samples.smartcheckin.company;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.exceptions.ResourceNotFoundException;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.user.UserRepository;

@SuppressWarnings("null")
class CompanyServiceTests {

    private CompanyRepository companyRepository;
    private UserRepository userRepository;
    private CompanyService companyService;

    @BeforeEach
    void setUp() {
        companyRepository = mock(CompanyRepository.class);
        userRepository = mock(UserRepository.class);
        companyService = new CompanyService(companyRepository, userRepository);
    }

    private static final String BA_GLASS = "BA Glass";
    private static final String EUROTALIA = "Eurotalia";

    @Test
    void testFindAll() {
        Company c1 = Company.builder().name(BA_GLASS).build();
        Company c2 = Company.builder().name("OT Noriega").build();
        when(companyRepository.findAll()).thenReturn(List.of(c1, c2));

        List<Company> result = companyService.findAll();
        assertEquals(2, result.size());
        verify(companyRepository, times(1)).findAll();
    }

    @Test
    void testFindByIdSuccess() {
        Company company = Company.builder().name(BA_GLASS).build();
        company.setId(1);
        when(companyRepository.findById(1)).thenReturn(Optional.of(company));

        Company result = companyService.findById(1);
        assertNotNull(result);
        assertEquals(BA_GLASS, result.getName());
    }

    @Test
    void testFindByIdNotFound() {
        when(companyRepository.findById(99)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> companyService.findById(99));
    }

    @Test
    void testFindByNameSuccess() {
        Company company = Company.builder().name(EUROTALIA).build();
        when(companyRepository.findByName(EUROTALIA)).thenReturn(Optional.of(company));

        Company result = companyService.findByName(EUROTALIA);
        assertNotNull(result);
        assertEquals(EUROTALIA, result.getName());
    }

    @Test
    void testFindByNameNotFound() {
        when(companyRepository.findByName("Unknown")).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> companyService.findByName("Unknown"));
    }

    @Test
    void testSave() {
        Company company = Company.builder().name("New Co").build();
        when(companyRepository.save(company)).thenReturn(company);

        Company saved = companyService.save(company);
        assertNotNull(saved);
        assertEquals("New Co", saved.getName());
        verify(companyRepository, times(1)).save(company);
    }

    @Test
    void testDeleteWithAssociatedUsersUnassignsThem() {
        Company company = Company.builder().name("To Delete").build();
        company.setId(5);

        User user1 = new User();
        user1.setId(1);
        user1.setCompany(company);

        User user2 = new User();
        user2.setId(2);
        user2.setCompany(company);

        List<User> userList = new ArrayList<>(List.of(user1, user2));

        when(companyRepository.findById(5)).thenReturn(Optional.of(company));
        when(userRepository.findByCompanyId(5)).thenReturn(userList);

        companyService.delete(5);

        assertNull(user1.getCompany());
        assertNull(user2.getCompany());
        verify(userRepository, times(1)).saveAll(userList);
        verify(companyRepository, times(1)).delete(company);
    }
}
