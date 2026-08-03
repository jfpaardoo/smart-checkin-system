package org.springframework.samples.smartcheckin.exports;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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

	private CertificateGeneratorService certificateGeneratorService;

	@BeforeEach
	void setUp() {
		certificateGeneratorService = new CertificateGeneratorService(localFileSystemService);
	}

	@Test
	void testGenerateCertificatePdfWithoutSignature() {
		User user = new User();
		user.setFirstName("John");
		user.setLastName("Doe");
		user.setPersonalCode("1234");

		Formation formation = new Formation();
		formation.setName("Spring Security 101");

		FormationAttendance attendance = new FormationAttendance();
		attendance.setUser(user);
		attendance.setFormation(formation);
		attendance.setCheckInDate(LocalDateTime.of(2026, 8, 1, 10, 0));

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
		formation.setName("Spring Security 101");

		FormationAttendance attendance = new FormationAttendance();
		attendance.setUser(user);
		attendance.setFormation(formation);
		attendance.setCheckInDate(LocalDateTime.of(2026, 8, 1, 10, 0));
		
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
		formation.setName("Spring Security 101");

		FormationAttendance attendance = new FormationAttendance();
		attendance.setUser(user);
		attendance.setFormation(formation);
		attendance.setCheckInDate(LocalDateTime.of(2026, 8, 1, 10, 0));
		attendance.setSignature("data:image/png;base64,INVALID_BASE64_DATA");

		byte[] pdfBytes = certificateGeneratorService.generateCertificatePdf(attendance);

		assertNotNull(pdfBytes);
		assertTrue(pdfBytes.length > 0);
	}
}
