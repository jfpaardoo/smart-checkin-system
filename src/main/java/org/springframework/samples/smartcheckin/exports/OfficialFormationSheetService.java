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
import org.apache.poi.hssf.usermodel.HSSFRichTextString;
import org.apache.poi.hssf.usermodel.HSSFRow;
import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFTextbox;
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
        try (InputStream stream = loadTemplateStream();
             HSSFWorkbook workbook = new HSSFWorkbook(stream)) {

            List<FormationAttendance> attendances = formation.getAttendances() != null ? formation.getAttendances() : List.of();
            int totalPages = Math.max(1, (int) Math.ceil(attendances.size() / 21.0));

            setupSheets(workbook, formation, totalPages);

            HSSFCellStyle textStyle = createTextStyle(workbook);
            HSSFCellStyle centerCrossStyle = workbook.createCellStyle();
            centerCrossStyle.cloneStyleFrom(textStyle);
            centerCrossStyle.setAlignment(HorizontalAlignment.CENTER);

            for (int p = 0; p < totalPages; p++) {
                renderPage(workbook.getSheetAt(p), formation, attendances, p, textStyle, centerCrossStyle);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            workbook.write(baos);
            return baos.toByteArray();
        }
    }

    private InputStream loadTemplateStream() throws IOException {
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
        return is;
    }

    private void setupSheets(HSSFWorkbook workbook, Formation formation, int totalPages) {
        String baseSheetName = "FOR99";
        if (formation.getFormationDate() != null) {
            baseSheetName = formation.getFormationDate().format(DateTimeFormatter.ofPattern("MMM-yy", Locale.of("es", "ES"))).toUpperCase();
        }

        for (int p = 1; p < totalPages; p++) {
            workbook.cloneSheet(0);
        }

        for (int p = 0; p < totalPages; p++) {
            String sheetName = totalPages == 1 ? baseSheetName : baseSheetName + " (" + (p + 1) + ")";
            workbook.setSheetName(p, sheetName);
        }
    }

    private void renderPage(HSSFSheet sheet, Formation formation, List<FormationAttendance> attendances,
                            int pageIndex, HSSFCellStyle textStyle, HSSFCellStyle centerCrossStyle) {
        HSSFPatriarch patriarch = sheet.getDrawingPatriarch();
        if (patriarch == null) {
            patriarch = sheet.createDrawingPatriarch();
        }

        populateCourseInfo(sheet, formation);
        populateSummary(sheet, formation);

        int startIdx = pageIndex * 21;
        int endIdx = Math.min(startIdx + 21, attendances.size());
        if (startIdx < attendances.size()) {
            List<FormationAttendance> pageAttendances = attendances.subList(startIdx, endIdx);
            int startRow = 23;
            for (int i = 0; i < pageAttendances.size(); i++) {
                int currentRow = startRow + i;
                renderAttendanceRow(sheet, patriarch, pageAttendances.get(i), currentRow, textStyle, centerCrossStyle, startIdx + i + 1);
            }
        }

        populateFooter(sheet, patriarch, formation);
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

        boolean isInsideWork = att.getWithinWorkingHours() != null
                ? Boolean.TRUE.equals(att.getWithinWorkingHours())
                : !Boolean.FALSE.equals(user.getIsWorking());
        int colCheck = isInsideWork ? 29 : 33;
        setStyledCellValue(sheet, currentRow, colCheck, "X", centerCrossStyle);
        drawCrossInBox(sheet, patriarch, currentRow, isInsideWork);

        byte[] signatureBytes = extractSignaturePng(att.getSignature());
        if (signatureBytes.length > 0) {
            insertSignature(sheet, patriarch, signatureBytes, currentRow);
        }
    }

    private void drawCrossInBox(HSSFSheet sheet, HSSFPatriarch patriarch, int currentRow, boolean isInsideWork) {
        try {
            int col1 = isInsideWork ? 30 : 34;
            int col2 = isInsideWork ? 31 : 35;
            int dx1 = isInsideWork ? 916 : 216;
            int dx2 = isInsideWork ? 904 : 916;
            int dy1 = 32;
            int dy2 = 213;

            HSSFClientAnchor anchor = new HSSFClientAnchor(
                    dx1, dy1, dx2, dy2,
                    (short) col1, currentRow, (short) col2, currentRow
            );
            anchor.setAnchorType(ClientAnchor.AnchorType.MOVE_AND_RESIZE);

            HSSFTextbox textbox = patriarch.createTextbox(anchor);
            HSSFFont font = sheet.getWorkbook().createFont();
            font.setFontName("Arial");
            font.setFontHeightInPoints((short) 10);
            font.setBold(true);

            HSSFRichTextString rts = new HSSFRichTextString("X");
            rts.applyFont(font);
            textbox.setString(rts);
            textbox.setHorizontalAlignment(HSSFTextbox.HORIZONTAL_ALIGNMENT_CENTERED);
            textbox.setVerticalAlignment(HSSFTextbox.VERTICAL_ALIGNMENT_CENTER);
            textbox.setMarginTop(0);
            textbox.setMarginBottom(0);
            textbox.setMarginLeft(0);
            textbox.setMarginRight(0);
            textbox.setLineStyle(org.apache.poi.hssf.usermodel.HSSFShape.LINESTYLE_NONE);
            textbox.setNoFill(true);
        } catch (Exception ignored) {
            // fallback gracefully
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