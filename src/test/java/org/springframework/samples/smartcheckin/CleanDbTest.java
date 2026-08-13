package org.springframework.samples.smartcheckin;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@Disabled("Script de utilidad manual para reiniciar la BD PostgreSQL local. Desactivado en CI.")
@ActiveProfiles("postgres")
@SpringBootTest(properties = {
    "spring.sql.init.mode=never",
    "spring.jpa.hibernate.ddl-auto=none"
})
class CleanDbTest {

    private static final Logger logger = LoggerFactory.getLogger(CleanDbTest.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void cleanDatabase() {
        assertDoesNotThrow(() -> {
            logger.info("Borrando el esquema public...");
            jdbcTemplate.execute("DROP SCHEMA public CASCADE;");
            jdbcTemplate.execute("CREATE SCHEMA public;");
            try {
                jdbcTemplate.execute("GRANT ALL ON SCHEMA public TO postgres;");
            } catch (Exception e) {
                logger.warn("No se pudo otorgar permisos al rol postgres: {}", e.getMessage());
            }
            jdbcTemplate.execute("GRANT ALL ON SCHEMA public TO public;");
            logger.info("Esquema public recreado correctamente.");
        });
    }
}
