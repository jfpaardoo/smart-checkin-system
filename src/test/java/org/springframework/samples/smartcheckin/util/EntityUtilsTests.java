package org.springframework.samples.smartcheckin.util;

import static org.junit.jupiter.api.Assertions.*;

import java.lang.reflect.Constructor;
import java.lang.reflect.Modifier;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.orm.ObjectRetrievalFailureException;
import org.springframework.samples.smartcheckin.model.BaseEntity;

class EntityUtilsTests {

    static class DummyEntity extends BaseEntity {}
    static class OtherDummyEntity extends BaseEntity {}

    @Test
    void testGetByIdFound() {
        DummyEntity entity1 = new DummyEntity();
        entity1.setId(1);
        DummyEntity entity2 = new DummyEntity();
        entity2.setId(2);

        List<DummyEntity> list = List.of(entity1, entity2);

        DummyEntity result = EntityUtils.getById(list, DummyEntity.class, 2);
        assertEquals(entity2, result);
    }

    @Test
    void testGetByIdNotFound() {
        DummyEntity entity1 = new DummyEntity();
        entity1.setId(1);

        List<DummyEntity> list = List.of(entity1);

        assertThrows(ObjectRetrievalFailureException.class, () -> EntityUtils.getById(list, DummyEntity.class, 2));
    }

    @Test
    @SuppressWarnings("unchecked")
    void testGetByIdClassMismatch() {
        OtherDummyEntity entity1 = new OtherDummyEntity();
        entity1.setId(1);

        List<OtherDummyEntity> list = List.of(entity1);

        // Forzamos la discrepancia de tipos de forma segura silenciando la advertencia del compilador
        assertThrows(ObjectRetrievalFailureException.class, () -> 
            EntityUtils.getById((List<DummyEntity>) (List<?>) list, DummyEntity.class, 1)
        );
    }

    @Test
    void testPrivateConstructor() throws Exception {
        Constructor<EntityUtils> constructor = EntityUtils.class.getDeclaredConstructor();
        assertTrue(Modifier.isPrivate(constructor.getModifiers()));
        constructor.setAccessible(true);
        
        assertThrows(Exception.class, constructor::newInstance);
    }
}