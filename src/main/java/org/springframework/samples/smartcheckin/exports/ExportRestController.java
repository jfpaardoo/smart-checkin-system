package org.springframework.samples.smartcheckin.exports;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.checkin.CheckinRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/v1/exports")
public class ExportRestController {

    private final CheckinRepository checkinRepository;

    @Autowired
    public ExportRestController(CheckinRepository checkinRepository) {
        this.checkinRepository = checkinRepository;
    }

    @GetMapping("/checkins/csv")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportCheckinsCsv() {
        List<Checkin> checkins = (List<Checkin>) checkinRepository.findAll();
        StringBuilder csvBuilder = new StringBuilder();
        csvBuilder.append("ID,User,Direction,Timestamp\n");

        for (Checkin checkin : checkins) {
            csvBuilder.append(checkin.getId()).append(",")
                    .append(checkin.getUser().getUsername()).append(",")
                    .append(checkin.getCheckInType()).append(",")
                    .append(checkin.getCheckInDate()).append("\n");
        }

        byte[] csvBytes = csvBuilder.toString().getBytes();

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=checkins.csv");
        headers.setContentType(MediaType.parseMediaType("text/csv"));

        return ResponseEntity.ok()
                .headers(headers)
                .body(csvBytes);
    }

    @GetMapping("/checkins/excel")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<byte[]> exportCheckinsExcel() throws IOException {
        List<Checkin> checkins = (List<Checkin>) checkinRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Checkins");
            Row headerRow = sheet.createRow(0);
            headerRow.createCell(0).setCellValue("ID");
            headerRow.createCell(1).setCellValue("User");
            headerRow.createCell(2).setCellValue("Direction");
            headerRow.createCell(3).setCellValue("Timestamp");

            int rowIdx = 1;
            for (Checkin checkin : checkins) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(checkin.getId());
                row.createCell(1).setCellValue(checkin.getUser().getUsername());
                row.createCell(2).setCellValue(checkin.getCheckInType().name());
                row.createCell(3).setCellValue(checkin.getCheckInDate().toString());
            }

            workbook.write(out);

            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=checkins.xlsx");
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(out.toByteArray());
        }
    }
}
