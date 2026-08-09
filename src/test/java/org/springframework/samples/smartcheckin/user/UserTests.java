package org.springframework.samples.smartcheckin.user;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class UserTests {
    private static final String ROLE_ADMIN = "ADMIN";
    private static final String ROLE_EMPLOYEE = "EMPLOYEE";

    @Test
    void testEmployeeBlockFormatting() {
        User user = new User();
        user.setPersonalCode("1234");
        user.setFirstName("Juan Felipe");
        user.setLastName("Pardo Carrillo");

        assertEquals("1234_Juan_Felipe_Pardo_Carrillo", user.getEmployeeBlock());
    }

    @Test
    void testEmployeeBlockWithNullNames() {
        User user = new User();
        user.setPersonalCode("5678");
        user.setFirstName(null);
        user.setLastName(null);

        assertEquals("5678__", user.getEmployeeBlock());
    }

    @Test
    void testHasAuthority() {
        Authorities auth = new Authorities();
        auth.setAuthority(ROLE_ADMIN);

        User user = new User();
        user.setAuthority(auth);

        assertTrue(user.hasAuthority(ROLE_ADMIN));
        assertFalse(user.hasAuthority(ROLE_EMPLOYEE));
    }

    @Test
    void testHasAnyAuthority() {
        Authorities auth = new Authorities();
        auth.setAuthority(ROLE_EMPLOYEE);

        User user = new User();
        user.setAuthority(auth);

        assertTrue(user.hasAnyAuthority(ROLE_ADMIN, ROLE_EMPLOYEE));
        assertFalse(user.hasAnyAuthority(ROLE_ADMIN, "MANAGER"));
    }

    @Test
    void testGetAuthoritiesWithValidRole() {
        Authorities auth = new Authorities();
        auth.setAuthority(ROLE_ADMIN);

        User user = new User();
        user.setAuthority(auth);

        var authorities = user.getAuthorities();
        assertNotNull(authorities);
        assertEquals(1, authorities.size());
        assertEquals(ROLE_ADMIN, authorities.get(0).getAuthority());
    }

    @Test
    void testGetAuthoritiesWithNullAuthorityOrRole() {
        User user1 = new User();
        user1.setAuthority(null);
        assertTrue(user1.getAuthorities().isEmpty());

        Authorities auth = new Authorities();
        auth.setAuthority(null);
        User user2 = new User();
        user2.setAuthority(auth);
        assertTrue(user2.getAuthorities().isEmpty());
    }

    @Test
    void testEqualsAndHashCodeExclusions() {
        User user1 = new User();
        user1.setId(1);
        user1.setUsername("test");

        User user2 = new User();
        user2.setId(1);
        user2.setUsername("test");

        assertEquals(user1, user2);
        assertEquals(user1.hashCode(), user2.hashCode());
    }
}