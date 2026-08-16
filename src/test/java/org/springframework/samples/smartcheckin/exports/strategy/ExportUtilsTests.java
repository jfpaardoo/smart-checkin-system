package org.springframework.samples.smartcheckin.exports.strategy;

import org.junit.jupiter.api.Test;
import java.time.Month;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.user.User;

import java.lang.reflect.Constructor;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class ExportUtilsTests {

    @Test
    void testGenerateVerificationHashNullAttendanceReturnsNA() {
        assertEquals("N/A", ExportUtils.generateVerificationHash(null));
    }

    @Test
    void testGenerateVerificationHashNullOrEmptySignatureReturnsNA() {
        FormationAttendance att = new FormationAttendance();
        assertEquals("N/A", ExportUtils.generateVerificationHash(att));

        att.setSignature("   ");
        assertEquals("N/A", ExportUtils.generateVerificationHash(att));
    }

    @Test
    void generateVerificationHashValidSignatureAndAllFieldsReturnsHash() {
        Formation formation = new Formation();
        formation.setId(10);
        formation.setFormationDate(LocalDateTime.of(2026, Month.MAY, 1, 10, 0));

        User user = new User();
        user.setId(5);
        user.setPersonalCode("EMP-123");

        FormationAttendance att = new FormationAttendance();
        att.setFormation(formation);
        att.setUser(user);
        att.setCheckInDate(LocalDateTime.of(2026, Month.MAY, 1, 10, 5));
        att.setCheckOutDate(LocalDateTime.of(2026, Month.MAY, 1, 12, 0));
        att.setSignature("base64signatureData");

        String hash = ExportUtils.generateVerificationHash(att);

        assertNotNull(hash);
        assertTrue(hash.startsWith("SHA256:"));
    }

    @Test
    void testGenerateVerificationHashNullSubFieldsHandlesDefaults() {
        FormationAttendance att = new FormationAttendance();
        att.setSignature("sig");

        String hash = ExportUtils.generateVerificationHash(att);

        assertNotNull(hash);
        assertTrue(hash.startsWith("SHA256:"));
    }

    @Test
    void testPrivateConstructorForCoverage() throws Exception {
        Constructor<ExportUtils> constructor = ExportUtils.class.getDeclaredConstructor();
        constructor.setAccessible(true);
        ExportUtils instance = constructor.newInstance();
        assertNotNull(instance);
    }
}
