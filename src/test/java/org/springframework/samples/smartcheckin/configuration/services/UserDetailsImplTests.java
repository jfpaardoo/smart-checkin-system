package org.springframework.samples.smartcheckin.configuration.services;

import static org.junit.jupiter.api.Assertions.*;

import java.util.Collections;

import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.user.Authorities;
import org.springframework.samples.smartcheckin.user.User;

class UserDetailsImplTests {

    @Test
    void testBuildAndGetters() {
        Authorities auth = new Authorities();
        auth.setAuthority("ADMIN");

        User user = new User();
        user.setId(10);
        user.setUsername("testuser");
        user.setPassword("secret");
        user.setAuthority(auth);

        UserDetailsImpl userDetails = UserDetailsImpl.build(user);

        assertNotNull(userDetails);
        assertEquals(10, userDetails.getId());
        assertEquals("testuser", userDetails.getUsername());
        assertEquals("secret", userDetails.getPassword());
        assertEquals(1, userDetails.getAuthorities().size());
        assertEquals("ADMIN", userDetails.getAuthorities().iterator().next().getAuthority());
        
        assertTrue(userDetails.isAccountNonExpired());
        assertTrue(userDetails.isAccountNonLocked());
        assertTrue(userDetails.isCredentialsNonExpired());
        assertTrue(userDetails.isEnabled());
    }

    @Test
    void testEqualsAndHashCode() {
        UserDetailsImpl user1 = new UserDetailsImpl(1, "user1", "pass", Collections.emptyList());
        UserDetailsImpl user2 = new UserDetailsImpl(1, "user2", "pass2", Collections.emptyList());
        UserDetailsImpl user3 = new UserDetailsImpl(2, "user3", "pass", Collections.emptyList());
        UserDetailsImpl userNullId1 = new UserDetailsImpl(null, "userNull1", "pass", Collections.emptyList());
        UserDetailsImpl userNullId2 = new UserDetailsImpl(null, "userNull2", "pass", Collections.emptyList());

        assertEquals(user1, user1);

        assertNotEquals(null, user1);

        assertNotEquals(user1, new Object());

        assertEquals(user1, user2);
        assertNotEquals(user1, user3);
        assertNotEquals(user1, userNullId1);
        assertEquals(userNullId1, userNullId2);

        assertEquals(user1.hashCode(), user2.hashCode());
        assertNotEquals(user1.hashCode(), user3.hashCode());
    }
}