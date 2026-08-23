package org.springframework.samples.smartcheckin.exports;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.company.Company;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.storage.SignatureStorageService;
import org.springframework.samples.smartcheckin.user.User;
import static org.mockito.Mockito.mock;

class OfficialFormationSheetServiceTest {

    private OfficialFormationSheetService sheetService;
    private SignatureStorageService signatureStorageService;
    private Formation sampleFormation;

    @BeforeEach
    void setUp() {
        signatureStorageService = mock(SignatureStorageService.class);
        sheetService = new OfficialFormationSheetService(signatureStorageService);

        Company company = new Company();
        company.setId(1);
        company.setName("BA Villafranca");

        User user1 = new User();
        user1.setId(1);
        user1.setUsername("juan.pardo");
        user1.setFirstName("Juan");
        user1.setLastName("Pardo");
        user1.setPersonalCode("EMP-12345");
        user1.setIsWorking(true);
        user1.setCompany(company);

        User user2 = new User();
        user2.setId(2);
        user2.setUsername("ana.garcia");
        user2.setFirstName("Ana");
        user2.setLastName("García");
        user2.setPersonalCode("EMP-67890");
        user2.setIsWorking(false);
        user2.setCompany(company);

        java.time.ZoneId zone = java.time.ZoneId.systemDefault();
        FormationAttendance att1 = new FormationAttendance();
        att1.setId(1);
        att1.setUser(user1);
        att1.setCheckInDate(LocalDateTime.now(zone).minusHours(1));
        // Base64 dummy 1x1 PNG
        att1.setSignature("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");

        FormationAttendance att2 = new FormationAttendance();
        att2.setId(2);
        att2.setUser(user2);
        att2.setCheckInDate(LocalDateTime.now(zone).minusHours(1));

        sampleFormation = Formation.builder()
                .name("Formación Prevención Picking")
                .description("Sumario detallado de la convocatoria de formación.")
                .formationDate(LocalDateTime.now(zone).plusDays(2))
                .attendances(new ArrayList<>(List.of(att1, att2)))
                .location("BA VILLAFRANCA")
                .trainer("VICTOR PARDO")
                .observations("Incidencia leve en el picking de la línea 3 resuelta.")
                .trainerSignature("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
                .isClosed(true)
                .build();
        sampleFormation.setId(101);
    }

    @Test
    void shouldGenerateOfficialSheetSuccessfully() throws Exception {
        byte[] xlsBytes = sheetService.generateOfficialSheet(sampleFormation);

        assertNotNull(xlsBytes);
        assertTrue(xlsBytes.length > 0);

        try (HSSFWorkbook wb = new HSSFWorkbook(new ByteArrayInputStream(xlsBytes))) {
            HSSFSheet sheet = wb.getSheetAt(0);
            assertNotNull(sheet);
            // Verificar celda del curso
            String courseName = sheet.getRow(7).getCell(5).getStringCellValue();
            assertTrue(courseName.contains("FORMACIÓN PREVENCIÓN") || courseName.contains("FORMACI"));

            // Verificar lugar y formador
            String location = sheet.getRow(8).getCell(19).getStringCellValue();
            assertTrue(location.contains("BA VILLAFRANCA"));

            String trainer = sheet.getRow(9).getCell(14).getStringCellValue();
            assertTrue(trainer.contains("VICTOR PARDO"));

            // Verificar observaciones
            String observations = sheet.getRow(45).getCell(2).getStringCellValue();
            assertTrue(observations.contains("Incidencia leve en el picking"));

            // Verificar asistente 1
            String attendeeName1 = sheet.getRow(23).getCell(4).getStringCellValue();
            assertTrue(attendeeName1.contains("JUAN PARDO"));
            String code1 = sheet.getRow(23).getCell(17).getStringCellValue();
            assertTrue(code1.contains("EMP-12345"));
            String insideWorking = sheet.getRow(23).getCell(29).getStringCellValue();
            assertTrue(insideWorking.contains("X"));

            // Verificar asistente 2
            String attendeeName2 = sheet.getRow(24).getCell(4).getStringCellValue();
            assertTrue(attendeeName2.contains("ANA GARCÍA") || attendeeName2.contains("ANA GARC"));
            String outsideWorking = sheet.getRow(24).getCell(33).getStringCellValue();
            assertTrue(outsideWorking.contains("X"));
        }
    }
}
