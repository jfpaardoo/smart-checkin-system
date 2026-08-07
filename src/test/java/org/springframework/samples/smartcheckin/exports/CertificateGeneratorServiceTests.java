package org.springframework.samples.smartcheckin.exports;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.time.Month;
import java.util.Base64;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.samples.smartcheckin.storage.LocalFileSystemService;

@ExtendWith(MockitoExtension.class)
class CertificateGeneratorServiceTests {

    @Mock
    private LocalFileSystemService localFileSystemService;

    @InjectMocks
    private CertificateGeneratorService certificateGeneratorService;

    private static final String SPRING_SECURITY_101 = "Spring Security 101";
    private static final String NULL_SIGNATURE = "null_signature.png";

    @Test
    void testGenerateCertificatePdfWithoutSignature() {
        User user = new User();
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setPersonalCode("1234");

        Formation formation = new Formation();
        formation.setName(SPRING_SECURITY_101);

        FormationAttendance attendance = new FormationAttendance();
        attendance.setUser(user);
        attendance.setFormation(formation);
        attendance.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 1, 10, 0));

        byte[] pdfBytes = certificateGeneratorService.generateCertificatePdf(attendance);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
    }

    @Test
    void testGenerateCertificatePdfWithSignature() {
        User user = new User();
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setPersonalCode("1234");

        Formation formation = new Formation();
        formation.setName(SPRING_SECURITY_101);

        FormationAttendance attendance = new FormationAttendance();
        attendance.setUser(user);
        attendance.setFormation(formation);
        attendance.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 1, 10, 0));
        
        String signatureData = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        attendance.setSignature(signatureData);

        byte[] pdfBytes = certificateGeneratorService.generateCertificatePdf(attendance);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
    }

    @Test
    void testGenerateCertificatePdfWithInvalidSignature() {
        User user = new User();
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setPersonalCode("1234");

        Formation formation = new Formation();
        formation.setName(SPRING_SECURITY_101);

        FormationAttendance attendance = new FormationAttendance();
        attendance.setUser(user);
        attendance.setFormation(formation);
        attendance.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 1, 10, 0));
        attendance.setSignature("data:image/png;base64,INVALID_BASE64_DATA");

        byte[] pdfBytes = certificateGeneratorService.generateCertificatePdf(attendance);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
    }

    @Test
    void testGenerateCertificatePdfWithNullCheckInDate() {
        User user = new User();
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setPersonalCode("1234");

        Formation formation = new Formation();
        formation.setName(SPRING_SECURITY_101);

        FormationAttendance attendance = new FormationAttendance();
        attendance.setUser(user);
        attendance.setFormation(formation);
        attendance.setCheckInDate(null); 

        byte[] pdfBytes = certificateGeneratorService.generateCertificatePdf(attendance);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
    }

    @Test
    void testGenerateCertificatePdfWithEmptySignature() {
        User user = new User();
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setPersonalCode("1234");

        Formation formation = new Formation();
        formation.setName(SPRING_SECURITY_101);

        FormationAttendance attendance = new FormationAttendance();
        attendance.setUser(user);
        attendance.setFormation(formation);
        attendance.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 1, 10, 0));
        attendance.setSignature(""); 

        byte[] pdfBytes = certificateGeneratorService.generateCertificatePdf(attendance);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
    }

    @Test
    void testGenerateCertificatePdfWithFileSignatureSuccess() {
        User user = new User();
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setPersonalCode("1234");

        Formation formation = new Formation();
        formation.setName(SPRING_SECURITY_101);

        FormationAttendance attendance = new FormationAttendance();
        attendance.setUser(user);
        attendance.setFormation(formation);
        attendance.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 1, 10, 0));
        attendance.setSignature("valid_signature.png"); 

        byte[] fakePng = Base64.getDecoder().decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
        when(localFileSystemService.loadSignature("valid_signature.png")).thenReturn(fakePng);

        byte[] pdfBytes = certificateGeneratorService.generateCertificatePdf(attendance);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
        verify(localFileSystemService, times(1)).loadSignature("valid_signature.png");
    }

    @Test
    void testGenerateCertificatePdfWithFileSignatureEmptyBytes() {
        User user = new User();
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setPersonalCode("1234");

        Formation formation = new Formation();
        formation.setName(SPRING_SECURITY_101);

        FormationAttendance attendance = new FormationAttendance();
        attendance.setUser(user);
        attendance.setFormation(formation);
        attendance.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 1, 10, 0));
        attendance.setSignature("empty_signature.png");

        when(localFileSystemService.loadSignature("empty_signature.png")).thenReturn(new byte[0]);

        byte[] pdfBytes = certificateGeneratorService.generateCertificatePdf(attendance);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
    }

    @Test
    void testGenerateCertificatePdfExceptionCatchBlock() {
        FormationAttendance attendance = new FormationAttendance();
        attendance.setUser(null);

        byte[] pdfBytes = certificateGeneratorService.generateCertificatePdf(attendance);

        assertNotNull(pdfBytes);
        assertEquals(0, pdfBytes.length);
    }

	@Test
    void testGenerateCertificatePdfWithFileSignatureNullBytes() {
        User user = new User();
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setPersonalCode("1234");

        Formation formation = new Formation();
        formation.setName(SPRING_SECURITY_101);

        FormationAttendance attendance = new FormationAttendance();
        attendance.setUser(user);
        attendance.setFormation(formation);
        attendance.setCheckInDate(LocalDateTime.of(2026, Month.AUGUST, 1, 10, 0));
        attendance.setSignature(NULL_SIGNATURE);

        when(localFileSystemService.loadSignature(NULL_SIGNATURE)).thenReturn(null);

        byte[] pdfBytes = certificateGeneratorService.generateCertificatePdf(attendance);

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
        verify(localFileSystemService, times(1)).loadSignature(NULL_SIGNATURE);
    }
}