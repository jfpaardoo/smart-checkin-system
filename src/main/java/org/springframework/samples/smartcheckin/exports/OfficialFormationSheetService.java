package org.springframework.samples.smartcheckin.exports;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

import org.apache.poi.hssf.usermodel.HSSFCell;
import org.apache.poi.hssf.usermodel.HSSFCellStyle;
import org.apache.poi.hssf.usermodel.HSSFClientAnchor;
import org.apache.poi.hssf.usermodel.HSSFFont;
import org.apache.poi.hssf.usermodel.HSSFPatriarch;
import org.apache.poi.hssf.usermodel.HSSFRow;
import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.ClientAnchor;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.usermodel.Workbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.storage.SignatureStorageService;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.stereotype.Service;

@Service
public class OfficialFormationSheetService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MMM-yy", Locale.of("es", "ES"));
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final String DEFAULT_TRAINER = "VICTOR PARDO";

    private final SignatureStorageService signatureStorageService;

    @Autowired
    public OfficialFormationSheetService(SignatureStorageService signatureStorageService) {
        this.signatureStorageService = signatureStorageService;
    }

    public byte[] generateOfficialSheet(Formation formation) throws IOException {
        InputStream is = getClass().getResourceAsStream("/templates/template_for99.xls");
        if (is == null) {
            ClassPathResource res = new ClassPathResource("templates/template_for99.xls");
            if (res.exists()) {
                is = res.getInputStream();
            }
        }
        if (is == null) {
            throw new IllegalStateException("Plantilla oficial template_for99.xls no encontrada en classpath.");
        }

        try (InputStream stream = is;
             HSSFWorkbook workbook = new HSSFWorkbook(stream)) {

            HSSFSheet sheet = workbook.getSheetAt(0);

            if (formation.getFormationDate() != null) {
                String sheetName = formation.getFormationDate().format(DateTimeFormatter.ofPattern("MMM-yy", Locale.of("es", "ES"))).toUpperCase();
                workbook.setSheetName(0, sheetName);
            }

            HSSFPatriarch patriarch = sheet.getDrawingPatriarch();
            if (patriarch == null) {
                patriarch = sheet.createDrawingPatriarch();
            }

            populateCourseInfo(sheet, formation);
            populateSummary(sheet, formation);
            populateAttendances(workbook, sheet, patriarch, formation.getAttendances());
            populateFooter(sheet, patriarch, formation);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        }
    }

    private void populateCourseInfo(HSSFSheet sheet, Formation formation) {
        setCellValue(sheet, 7, 5, formation.getName() != null ? formation.getName().toUpperCase() : "");

        if (formation.getFormationDate() != null) {
            LocalDateTime start = formation.getFormationDate();
            setCellValue(sheet, 8, 5, start.format(DATE_FMT).toLowerCase());
            setCellValue(sheet, 8, 13, start.format(TIME_FMT));
            LocalDateTime end = start.plusHours(1);
            setCellValue(sheet, 8, 16, end.format(TIME_FMT));
        }

        String location = formation.getLocation() != null && !formation.getLocation().isBlank()
                ? formation.getLocation().toUpperCase()
                : "BA VILLAFRANCA";
        setCellValue(sheet, 8, 19, location);
        setCellValue(sheet, 8, 32, "1 H.");
        setCellValue(sheet, 9, 32, "1 H.");

        String trainer = formation.getTrainer() != null && !formation.getTrainer().isBlank()
                ? formation.getTrainer().toUpperCase()
                : DEFAULT_TRAINER;
        setCellValue(sheet, 9, 14, trainer);
    }

    private void populateSummary(HSSFSheet sheet, Formation formation) {
        if (formation.getDescription() != null && !formation.getDescription().isBlank()) {
            setCellValue(sheet, 12, 3, formation.getDescription());
        }
        if (formation.getObservations() != null && !formation.getObservations().isBlank()) {
            setCellValue(sheet, 45, 2, formation.getObservations());
        }
    }

    private void populateAttendances(HSSFWorkbook workbook, HSSFSheet sheet, HSSFPatriarch patriarch, List<FormationAttendance> attendances) {
        if (attendances == null || attendances.isEmpty()) {
            return;
        }

        HSSFCellStyle textStyle = createTextStyle(workbook);
        HSSFCellStyle centerCrossStyle = workbook.createCellStyle();
        centerCrossStyle.cloneStyleFrom(textStyle);
        centerCrossStyle.setAlignment(HorizontalAlignment.CENTER);

        int startRow = 23;
        int maxRows = 21;

        for (int i = 0; i < Math.min(attendances.size(), maxRows); i++) {
            int currentRow = startRow + i;
            renderAttendanceRow(sheet, patriarch, attendances.get(i), currentRow, textStyle, centerCrossStyle, i + 1);
        }
    }

    private void renderAttendanceRow(HSSFSheet sheet, HSSFPatriarch patriarch,
                                     FormationAttendance att, int currentRow,
                                     HSSFCellStyle textStyle, HSSFCellStyle centerCrossStyle, int position) {
        User user = att.getUser();
        if (user == null) {
            return;
        }

        String fullName = ((user.getFirstName() != null ? user.getFirstName() : "") + " " +
                           (user.getLastName() != null ? user.getLastName() : "")).trim();
        if (fullName.isEmpty()) {
            fullName = user.getUsername() != null ? user.getUsername() : "Asistente " + position;
        }
        setStyledCellValue(sheet, currentRow, 4, fullName.toUpperCase(), textStyle);

        String personalCode = user.getPersonalCode() != null ? user.getPersonalCode() : String.valueOf(user.getId());
        setStyledCellValue(sheet, currentRow, 17, personalCode, textStyle);

        boolean isWorking = !Boolean.FALSE.equals(user.getIsWorking());
        int colCheck = isWorking ? 29 : 33;
        setStyledCellValue(sheet, currentRow, colCheck, "X", centerCrossStyle);

        byte[] signatureBytes = extractSignaturePng(att.getSignature());
        if (signatureBytes.length > 0) {
            insertSignature(sheet, patriarch, signatureBytes, currentRow);
        }
    }

    private void insertSignature(HSSFSheet sheet, HSSFPatriarch patriarch, byte[] signatureBytes, int currentRow) {
        try {
            int format = (signatureBytes.length > 3 && signatureBytes[0] == (byte) 0xFF && signatureBytes[1] == (byte) 0xD8)
                    ? Workbook.PICTURE_TYPE_JPEG
                    : Workbook.PICTURE_TYPE_PNG;

            int pictureIdx = sheet.getWorkbook().addPicture(signatureBytes, format);
            HSSFClientAnchor anchor = new HSSFClientAnchor(
                    20, 10, 1000, 240,
                    (short) 20, currentRow, (short) 28, currentRow
            );
            anchor.setAnchorType(ClientAnchor.AnchorType.MOVE_AND_RESIZE);
            patriarch.createPicture(anchor, pictureIdx);
        } catch (Exception ignored) {
            // Ignorar imagen inválida para no bloquear la generación del archivo
        }
    }

    private void populateFooter(HSSFSheet sheet, HSSFPatriarch patriarch, Formation formation) {
        if (formation.getFormationDate() != null) {
            setCellValue(sheet, 53, 5, formation.getFormationDate().format(DATE_FMT).toLowerCase());
        }
        String trainer = formation.getTrainer() != null && !formation.getTrainer().isBlank()
                ? formation.getTrainer().toUpperCase()
                : DEFAULT_TRAINER;
        setCellValue(sheet, 53, 22, trainer);

        if (formation.getTrainerSignature() != null && !formation.getTrainerSignature().isBlank()) {
            byte[] trainerSigBytes = extractSignaturePng(formation.getTrainerSignature());
            if (trainerSigBytes.length > 0) {
                insertTrainerSignature(sheet, patriarch, trainerSigBytes);
            }
        }
    }

    private void insertTrainerSignature(HSSFSheet sheet, HSSFPatriarch patriarch, byte[] signatureBytes) {
        try {
            int format = (signatureBytes.length > 3 && signatureBytes[0] == (byte) 0xFF && signatureBytes[1] == (byte) 0xD8)
                    ? Workbook.PICTURE_TYPE_JPEG
                    : Workbook.PICTURE_TYPE_PNG;

            int pictureIdx = sheet.getWorkbook().addPicture(signatureBytes, format);
            HSSFClientAnchor anchor = new HSSFClientAnchor(
                    20, 5, 1000, 240,
                    (short) 22, 51, (short) 36, 53
            );
            anchor.setAnchorType(ClientAnchor.AnchorType.MOVE_AND_RESIZE);
            patriarch.createPicture(anchor, pictureIdx);
        } catch (Exception ignored) {
            // Ignorar imagen inválida para no bloquear la generación del archivo
        }
    }

    private HSSFCellStyle createTextStyle(HSSFWorkbook workbook) {
        HSSFCellStyle textStyle = workbook.createCellStyle();
        HSSFFont font = workbook.createFont();
        font.setFontName("Calibri");
        font.setFontHeightInPoints((short) 9);
        font.setBold(true);
        textStyle.setFont(font);
        textStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        return textStyle;
    }

    private void setCellValue(HSSFSheet sheet, int rowIndex, int colIndex, String value) {
        HSSFRow row = sheet.getRow(rowIndex);
        if (row == null) {
            row = sheet.createRow(rowIndex);
        }
        HSSFCell cell = row.getCell(colIndex);
        if (cell == null) {
            cell = row.createCell(colIndex);
        }
        cell.setCellValue(value != null ? value : "");
    }

    private void setStyledCellValue(HSSFSheet sheet, int rowIndex, int colIndex, String value, HSSFCellStyle style) {
        HSSFRow row = sheet.getRow(rowIndex);
        if (row == null) {
            row = sheet.createRow(rowIndex);
        }
        HSSFCell cell = row.getCell(colIndex);
        if (cell == null) {
            cell = row.createCell(colIndex);
        }
        cell.setCellValue(value != null ? value : "");
        if (style != null) {
            cell.setCellStyle(style);
        }
    }

    private byte[] extractSignaturePng(String signature) {
        if (signature == null || signature.trim().isEmpty()) {
            return new byte[0];
        }
        String sig = signature.trim();
        if (sig.startsWith("data:image")) {
            String[] parts = sig.split(",", 2);
            if (parts.length < 2) {
                return new byte[0];
            }
            try {
                return Base64.getDecoder().decode(parts[1]);
            } catch (IllegalArgumentException e) {
                return Base64.getUrlDecoder().decode(parts[1]);
            }
        }
        try {
            if (signatureStorageService != null) {
                byte[] loaded = signatureStorageService.loadSignature(sig);
                if (loaded != null && loaded.length > 0) {
                    return loaded;
                }
            }
            return Base64.getDecoder().decode(sig);
        } catch (Exception e) {
            return new byte[0];
        }
    }
}