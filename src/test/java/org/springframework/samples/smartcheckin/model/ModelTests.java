package org.springframework.samples.smartcheckin.model;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class ModelTests {

    @Test
    void testBaseEntity() {
        BaseEntity entity = new BaseEntity();
        
        assertTrue(entity.isNew());
        
        entity.setId(1);
        assertEquals(1, entity.getId());
        assertFalse(entity.isNew());
        
        LocalDateTime now = LocalDateTime.now();
        entity.setCreatedAt(now);
        assertEquals(now, entity.getCreatedAt());
        
        entity.setUpdatedAt(now);
        assertEquals(now, entity.getUpdatedAt());

        BaseEntity entity2 = new BaseEntity();
        entity2.setId(1);
        assertEquals(entity, entity2);
        assertEquals(entity.hashCode(), entity2.hashCode());
    }

    @Test
    void testPerson() {
        Person person = new Person();
        
        person.setFirstName("John");
        assertEquals("John", person.getFirstName());
        
        person.setLastName("Doe");
        assertEquals("Doe", person.getLastName());
    }

    @Test
    void testNamedEntity() {
        NamedEntity namedEntity = new NamedEntity();
        
        namedEntity.setName("TestName");
        assertEquals("TestName", namedEntity.getName());
        assertEquals("TestName", namedEntity.toString());
    }
}
