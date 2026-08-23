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
        att1.setWithinWorkingHours(true);
        att1.setCheckInDate(LocalDateTime.now(zone).minusHours(1));
        // Base64 dummy 1x1 PNG
        att1.setSignature(
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");

        FormationAttendance att2 = new FormationAttendance();
        att2.setId(2);
        att2.setUser(user2);
        att2.setWithinWorkingHours(false);
        att2.setCheckInDate(LocalDateTime.now(zone).minusHours(1));

        sampleFormation = Formation.builder()
                .name("Formación Prevención Picking")
                .description("Sumario detallado de la convocatoria de formación.")
                .formationDate(LocalDateTime.now(zone).plusDays(2))
                .attendances(new ArrayList<>(List.of(att1, att2)))
                .location("BA VILLAFRANCA")
                .trainer("VICTOR PARDO")
                .observations("Incidencia leve en el picking de la línea 3 resuelta.")
                .trainerSignature(
                        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
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

            // Verificar lugar y formador en cabecera
            String location = sheet.getRow(8).getCell(19).getStringCellValue();
            assertTrue(location.contains("BA VILLAFRANCA"));

            String trainer = sheet.getRow(9).getCell(14).getStringCellValue();
            assertTrue(trainer.contains("VICTOR PARDO"));

            // Verificar formador en pie de documento
            String footerTrainer = sheet.getRow(53).getCell(22).getStringCellValue();
            assertTrue(footerTrainer.contains("VICTOR PARDO"));

            // Verificar observaciones
            String observations = sheet.getRow(45).getCell(2).getStringCellValue();
            assertTrue(observations.contains("Incidencia leve en el picking"));

            // Verificar asistente 1 (Dentro de horario -> Columna 29)
            String attendeeName1 = sheet.getRow(23).getCell(4).getStringCellValue();
            assertTrue(attendeeName1.contains("JUAN PARDO"));
            String code1 = sheet.getRow(23).getCell(17).getStringCellValue();
            assertTrue(code1.contains("EMP-12345"));
            String insideWorking = sheet.getRow(23).getCell(29).getStringCellValue();
            assertTrue(insideWorking.contains("X"));

            // Verificar asistente 2 (Fuera de horario -> Columna 33)
            String attendeeName2 = sheet.getRow(24).getCell(4).getStringCellValue();
            assertTrue(attendeeName2.contains("ANA GARCÍA") || attendeeName2.contains("ANA GARC"));
            String outsideWorking = sheet.getRow(24).getCell(33).getStringCellValue();
            assertTrue(outsideWorking.contains("X"));
        }
    }

    @Test
    void shouldGenerateMultiplePagesWhenMoreThan21Attendees() throws Exception {
        // Crear 45 asistentes (deben generar 3 páginas: 21 + 21 + 3)
        List<FormationAttendance> attendances = new ArrayList<>();
        java.time.ZoneId zone = java.time.ZoneId.systemDefault();

        for (int i = 1; i <= 45; i++) {
            User user = new User();
            user.setId(i);
            user.setUsername("user" + i);
            user.setFirstName("Nombre" + i);
            user.setLastName("Apellido" + i);
            user.setPersonalCode("EMP-" + (1000 + i));

            FormationAttendance att = new FormationAttendance();
            att.setId(i);
            att.setUser(user);
            att.setWithinWorkingHours(i % 2 == 1); // Alternar dentro/fuera de horario
            att.setCheckInDate(LocalDateTime.now(zone));

            attendances.add(att);
        }

        Formation largeFormation = Formation.builder()
                .name("Formación Masiva Planta")
                .description("Formación de seguridad con asistencia masiva.")
                .formationDate(LocalDateTime.now(zone))
                .attendances(attendances)
                .location("PLANTA PRINCIPAL")
                .trainer("CARLOS RUIZ")
                .build();
        largeFormation.setId(200);

        byte[] xlsBytes = sheetService.generateOfficialSheet(largeFormation);

        assertNotNull(xlsBytes);
        assertTrue(xlsBytes.length > 0);

        try (HSSFWorkbook wb = new HSSFWorkbook(new ByteArrayInputStream(xlsBytes))) {
            // Verificar que se crearon 3 páginas/hojas
            org.junit.jupiter.api.Assertions.assertEquals(3, wb.getNumberOfSheets());

            // Hoja 1: Contiene asistentes 1 al 21
            HSSFSheet page1 = wb.getSheetAt(0);
            assertTrue(page1.getRow(7).getCell(5).getStringCellValue().contains("FORMACIÓN MASIVA"));
            assertTrue(page1.getRow(8).getCell(19).getStringCellValue().contains("PLANTA PRINCIPAL"));
            assertTrue(page1.getRow(23).getCell(4).getStringCellValue().contains("NOMBRE1 APELLIDO1"));
            assertTrue(page1.getRow(43).getCell(4).getStringCellValue().contains("NOMBRE21 APELLIDO21"));

            // Hoja 2: Contiene asistentes 22 al 42
            HSSFSheet page2 = wb.getSheetAt(1);
            assertTrue(page2.getRow(23).getCell(4).getStringCellValue().contains("NOMBRE22 APELLIDO22"));
            assertTrue(page2.getRow(43).getCell(4).getStringCellValue().contains("NOMBRE42 APELLIDO42"));

            // Hoja 3: Contiene asistentes 43 al 45
            HSSFSheet page3 = wb.getSheetAt(2);
            assertTrue(page3.getRow(23).getCell(4).getStringCellValue().contains("NOMBRE43 APELLIDO43"));
            assertTrue(page3.getRow(25).getCell(4).getStringCellValue().contains("NOMBRE45 APELLIDO45"));
        }
    }
}
