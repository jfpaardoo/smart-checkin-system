package org.springframework.samples.smartcheckin.exports;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.storage.SignatureStorageService;
import org.springframework.samples.smartcheckin.util.HashUtils;
import org.springframework.stereotype.Service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class CertificateGeneratorService {

    private static final Logger logger = LoggerFactory.getLogger(CertificateGeneratorService.class);

    private final SignatureStorageService signatureStorageService;

    // Brand Palette - Executive Distribution Academy / BA Glass Identity
    private static final Color COLOR_PRIMARY = new Color(15, 23, 42);       // #0F172A Deep Slate Navy
    private static final Color COLOR_ACCENT = new Color(197, 155, 39);      // #C59B27 Noble Warm Gold
    private static final Color COLOR_BRAND_GREEN = new Color(138, 158, 34); // #8A9E22 BA Glass Corporate Olive/Lime
    private static final Color COLOR_SLATE_DARK = new Color(51, 65, 85);    // #334155 Slate Dark
    private static final Color COLOR_SLATE_MUTED = new Color(100, 116, 139);// #64748B Slate Muted
    private static final Color COLOR_CARD_BG = new Color(248, 250, 252);    // #F8FAFC Card Neutral Background
    private static final Color COLOR_CARD_BORDER = new Color(226, 232, 240);// #E2E8F0 Card Hairline Border
    private static final Color COLOR_SEAL_BG = new Color(254, 252, 243);    // #FEFCF3 Warm Gold Soft Tint
    private static final Color COLOR_LINE = new Color(203, 213, 225);       // #CBD5E1 Divider Line

    // Typography
    private static final Font FONT_ACADEMY_BADGE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9.5f, COLOR_ACCENT);
    private static final Font FONT_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 21f, COLOR_PRIMARY);
    private static final Font FONT_SUBTITLE = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, COLOR_SLATE_MUTED);
    private static final Font FONT_LABEL = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, COLOR_SLATE_DARK);
    private static final Font FONT_STUDENT_NAME = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 19f, COLOR_PRIMARY);
    private static final Font FONT_STUDENT_META = FontFactory.getFont(FontFactory.HELVETICA, 8.5f, COLOR_SLATE_MUTED);
    private static final Font FONT_COURSE_NAME = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13.5f, COLOR_PRIMARY);
    private static final Font FONT_COURSE_DESC = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8f, COLOR_SLATE_MUTED);
    private static final Font FONT_CARD_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 6.5f, COLOR_ACCENT);
    private static final Font FONT_CARD_VALUE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, COLOR_PRIMARY);
    private static final Font FONT_SIG_ROLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7f, COLOR_SLATE_MUTED);
    private static final Font FONT_SIG_NAME = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8f, COLOR_PRIMARY);
    private static final Font FONT_SEAL_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, COLOR_ACCENT);
    private static final Font FONT_SEAL_MAIN = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8.5f, COLOR_PRIMARY);
    private static final Font FONT_SEAL_SUB = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7f, COLOR_BRAND_GREEN);
    private static final Font FONT_SEAL_CODE = FontFactory.getFont(FontFactory.COURIER, 7f, COLOR_SLATE_MUTED);
    private static final Font FONT_LINE = FontFactory.getFont(FontFactory.HELVETICA, 7f, COLOR_LINE);
    private static final Font FONT_HASH = FontFactory.getFont(FontFactory.COURIER, 6.5f, COLOR_SLATE_MUTED);
    private static final Font FONT_LEGAL = FontFactory.getFont(FontFactory.HELVETICA, 6.5f, COLOR_SLATE_MUTED);

    public CertificateGeneratorService(SignatureStorageService signatureStorageService) {
        this.signatureStorageService = signatureStorageService;
    }

    // Modern Executive Diploma Border and Watermark Event
    private static class DiplomaBorderEvent extends PdfPageEventHelper {
        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContentUnder();
            float width = document.getPageSize().getWidth();
            float height = document.getPageSize().getHeight();

            // 1. Crisp clean background
            cb.setColorFill(new Color(255, 255, 255));
            cb.rectangle(0, 0, width, height);
            cb.fill();

            // 2. Outer Deep Slate Navy Frame
            cb.setColorStroke(COLOR_PRIMARY);
            cb.setLineWidth(2.5f);
            cb.rectangle(18, 18, width - 36, height - 36);
            cb.stroke();

            // 3. Inner Noble Warm Gold Frame
            cb.setColorStroke(COLOR_ACCENT);
            cb.setLineWidth(1.0f);
            cb.rectangle(24, 24, width - 48, height - 48);
            cb.stroke();

            // 4. Subtle Olive/Lime Hairline Accent
            cb.setColorStroke(new Color(138, 158, 34, 100));
            cb.setLineWidth(0.5f);
            cb.rectangle(27, 27, width - 54, height - 54);
            cb.stroke();

            // 5. Corner Ornaments (Luxury diploma geometric corner dots)
            drawCornerOrnaments(cb, width, height);

            // 6. Watermark crest in center
            drawWatermark(cb, width / 2f, height / 2f + 10);
        }

        private void drawCornerOrnaments(PdfContentByte cb, float width, float height) {
            cb.setColorFill(COLOR_ACCENT);
            float[][] corners = {
                {24, 24},
                {width - 24, 24},
                {24, height - 24},
                {width - 24, height - 24}
            };
            for (float[] corner : corners) {
                cb.circle(corner[0], corner[1], 2.8f);
                cb.fill();
            }
        }

        private void drawWatermark(PdfContentByte cb, float cx, float cy) {
            cb.setColorStroke(new Color(241, 245, 249)); // very soft slate
            cb.setLineWidth(1.5f);
            cb.circle(cx, cy, 140f);
            cb.stroke();

            cb.setColorStroke(new Color(248, 250, 252));
            cb.setLineWidth(1f);
            cb.circle(cx, cy, 125f);
            cb.stroke();
        }
    }

    public byte[] generateCertificatePdf(FormationAttendance attendance) {
        Document document = new Document(PageSize.A4.rotate(), 42, 42, 34, 34);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new DiplomaBorderEvent());
            document.open();

            // Defensive checks for null values
            if (attendance == null || attendance.getUser() == null || attendance.getFormation() == null) {
                logger.error("Invalid attendance data for certificate generation");
                Paragraph errorBody = new Paragraph("Error: Datos de asistencia insuficientes para generar el certificado.", FONT_LABEL);
                document.add(errorBody);
                document.close();
                return out.toByteArray();
            }

            String studentName = resolveStudentName(attendance);
            String studentCode = safe(attendance.getUser().getPersonalCode());
            String formationName = safe(attendance.getFormation().getName());
            String location = safe(attendance.getFormation().getLocation());
            if (location.isEmpty()) {
                location = "BA Glass Sede";
            }

            buildHeaderSection(document);
            buildStudentSection(document, attendance, studentName, studentCode);
            buildCourseSection(document, formationName, safe(attendance.getFormation().getDescription()));
            buildInfoTable(document, attendance, location);
            buildSignaturesTable(document, attendance, studentName);
            buildSecurityFooter(document, attendance, studentCode, formationName, location);

            document.close();
        } catch (Exception ex) {
            logger.error("Error generating certificate PDF", ex);
        }

        return out.toByteArray();
    }

    private void buildHeaderSection(Document document) throws DocumentException {
        Paragraph orgName = new Paragraph("●   D I S T R I B U T I O N   A C A D E M Y   ●", FONT_ACADEMY_BADGE);
        orgName.setAlignment(Element.ALIGN_CENTER);
        orgName.setSpacingAfter(3f);
        document.add(orgName);

        Paragraph title = new Paragraph("CERTIFICADO DE APROVECHAMIENTO", FONT_TITLE);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(2f);
        document.add(title);

        Paragraph intro = new Paragraph("Acreditación Oficial de Formación Continua y Capacitación Profesional", FONT_SUBTITLE);
        intro.setAlignment(Element.ALIGN_CENTER);
        intro.setSpacingAfter(10f);
        document.add(intro);
    }

    private void buildStudentSection(Document document, FormationAttendance attendance, String studentName, String studentCode) throws DocumentException {
        Paragraph certText = new Paragraph("Se certifica con carácter oficial que el/la alumno/a:", FONT_LABEL);
        certText.setAlignment(Element.ALIGN_CENTER);
        certText.setSpacingAfter(3f);
        document.add(certText);

        Paragraph pStudent = new Paragraph(studentName.toUpperCase(Locale.of("es", "ES")), FONT_STUDENT_NAME);
        pStudent.setAlignment(Element.ALIGN_CENTER);
        pStudent.setSpacingAfter(3f);
        document.add(pStudent);

        String locator = safe(attendance.getUser().getLocator());
        String companyName = (attendance.getUser().getCompany() != null && attendance.getUser().getCompany().getName() != null)
                ? attendance.getUser().getCompany().getName()
                : "BA Glass";

        StringBuilder metaBuilder = new StringBuilder();
        if (!studentCode.isEmpty()) {
            metaBuilder.append("Código Empleado: ").append(studentCode);
        }
        if (!locator.isEmpty()) {
            if (!metaBuilder.isEmpty()) metaBuilder.append("   •   ");
            metaBuilder.append("Localizador: ").append(locator);
        }
        if (!companyName.isEmpty()) {
            if (!metaBuilder.isEmpty()) metaBuilder.append("   •   ");
            metaBuilder.append("Empresa: ").append(companyName);
        }
        Paragraph pStudentMeta = new Paragraph(metaBuilder.toString(), FONT_STUDENT_META);
        pStudentMeta.setAlignment(Element.ALIGN_CENTER);
        pStudentMeta.setSpacingAfter(9f);
        document.add(pStudentMeta);
    }

    private void buildCourseSection(Document document, String formationName, String formationDescription) throws DocumentException {
        Paragraph pHasCompleted = new Paragraph("Ha asistido y completado con pleno aprovechamiento el programa de capacitación:", FONT_LABEL);
        pHasCompleted.setAlignment(Element.ALIGN_CENTER);
        pHasCompleted.setSpacingAfter(4f);
        document.add(pHasCompleted);

        PdfPTable courseTable = new PdfPTable(1);
        courseTable.setWidthPercentage(100);
        courseTable.setSpacingAfter(9f);

        PdfPCell courseCell = new PdfPCell();
        courseCell.setBackgroundColor(COLOR_CARD_BG);
        courseCell.setBorderColor(COLOR_CARD_BORDER);
        courseCell.setBorderWidth(1f);
        courseCell.setBorderColorLeft(COLOR_BRAND_GREEN);
        courseCell.setBorderWidthLeft(3.5f);
        courseCell.setPadding(6f);
        courseCell.setPaddingLeft(10f);

        Paragraph pCourse = new Paragraph(formationName, FONT_COURSE_NAME);
        courseCell.addElement(pCourse);

        if (!formationDescription.isEmpty()) {
            Paragraph pDesc = new Paragraph(formationDescription, FONT_COURSE_DESC);
            pDesc.setSpacingBefore(2f);
            courseCell.addElement(pDesc);
        }

        courseTable.addCell(courseCell);
        document.add(courseTable);
    }

    private void buildInfoTable(Document document, FormationAttendance attendance, String location) throws DocumentException {
        LocalDateTime effectiveDate = attendance.getCheckInDate() != null
                ? attendance.getCheckInDate()
                : attendance.getFormation().getFormationDate();
        String formattedDate = formatDate(effectiveDate);
        String scheduleAndDuration = formatScheduleAndDuration(attendance.getCheckInDate(), attendance.getCheckOutDate());
        String trainer = safe(attendance.getFormation().getTrainer());
        if (trainer.isEmpty()) {
            trainer = "Dirección de Formación";
        }

        PdfPTable infoTable = new PdfPTable(4);
        infoTable.setWidthPercentage(100);
        infoTable.setWidths(new float[]{1f, 1.25f, 1f, 1f});
        infoTable.setSpacingAfter(9f);

        infoTable.addCell(createInfoCard("FECHA DE REALIZACIÓN", formattedDate));
        infoTable.addCell(createInfoCard("HORARIO Y DURACIÓN", scheduleAndDuration));
        infoTable.addCell(createInfoCard("SEDE / CENTRO", location));
        infoTable.addCell(createInfoCard("FORMADOR RESPONSABLE", trainer));

        document.add(infoTable);
    }

    private void buildSignaturesTable(Document document, FormationAttendance attendance, String studentName) throws DocumentException {
        PdfPTable bottomTable = new PdfPTable(3);
        bottomTable.setWidthPercentage(100);
        bottomTable.setWidths(new float[]{1.3f, 1.4f, 1.3f});
        bottomTable.setSpacingAfter(8f);

        // Left: Employee signature
        PdfPCell studentCell = new PdfPCell();
        studentCell.setBorder(Rectangle.NO_BORDER);
        studentCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        if (attendance.getSignature() != null && !attendance.getSignature().trim().isEmpty()) {
            addSignatureToCell(studentCell, attendance.getSignature(), "Firma del Alumno / Empleado", studentName);
        } else {
            addSignaturePlaceholder(studentCell, "Firma del Alumno / Empleado", studentName);
        }
        bottomTable.addCell(studentCell);

        // Center: Official Digital Seal
        PdfPCell sealCell = new PdfPCell();
        sealCell.setBorder(Rectangle.NO_BORDER);
        sealCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        sealCell.setPaddingLeft(10f);
        sealCell.setPaddingRight(10f);
        sealCell.addElement(createOfficialSealCard());
        bottomTable.addCell(sealCell);

        // Right: Trainer / Academy signature
        PdfPCell trainerCell = new PdfPCell();
        trainerCell.setBorder(Rectangle.NO_BORDER);
        trainerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        String trainer = safe(attendance.getFormation().getTrainer());
        if (trainer.isEmpty()) {
            trainer = "Dirección de Formación";
        }
        String trainerSig = attendance.getFormation().getTrainerSignature();
        if (trainerSig != null && !trainerSig.trim().isEmpty()) {
            addSignatureToCell(trainerCell, trainerSig, "Dirección de Formación / Tutor", trainer);
        } else {
            addSignaturePlaceholder(trainerCell, "Dirección de Formación / Tutor", trainer);
        }
        bottomTable.addCell(trainerCell);

        document.add(bottomTable);
    }

    private void buildSecurityFooter(Document document, FormationAttendance attendance, String studentCode, String formationName, String location) throws DocumentException {
        String rawData = studentCode + "-" + formationName + "-" + (attendance.getCheckInDate() != null ? attendance.getCheckInDate().toString() : "") + "-" + location;
        String hash = HashUtils.generateHash(rawData);

        Paragraph pHash = new Paragraph("SELLO CRIPTOGRÁFICO DE VERIFICACIÓN (SHA-256): " + hash, FONT_HASH);
        pHash.setAlignment(Element.ALIGN_CENTER);
        pHash.setSpacingBefore(4f);
        document.add(pHash);

        Paragraph pLegal = new Paragraph("Certificado oficial inmutable expedido por Smart Check-in para Distribution Academy (BA Glass). Válido como acreditación ante auditorías y registros de formación continua.", FONT_LEGAL);
        pLegal.setAlignment(Element.ALIGN_CENTER);
        pLegal.setSpacingBefore(1f);
        document.add(pLegal);
    }

    private String resolveStudentName(FormationAttendance attendance) {
        String studentName = (safe(attendance.getUser().getFirstName()) + " " + safe(attendance.getUser().getLastName())).trim();
        return studentName.isEmpty() ? "Empleado" : studentName;
    }

    private PdfPCell createInfoCard(String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_CARD_BG);
        cell.setBorderColor(COLOR_CARD_BORDER);
        cell.setBorderWidth(1f);
        cell.setPadding(5f);
        cell.setPaddingTop(4f);
        cell.setPaddingBottom(5f);

        Paragraph pLabel = new Paragraph(label, FONT_CARD_TITLE);
        pLabel.setSpacingAfter(2f);
        cell.addElement(pLabel);

        Paragraph pValue = new Paragraph(value, FONT_CARD_VALUE);
        cell.addElement(pValue);

        return cell;
    }

    private PdfPTable createOfficialSealCard() {
        PdfPTable sealTable = new PdfPTable(1);
        sealTable.setWidthPercentage(100);

        PdfPCell sealCell = new PdfPCell();
        sealCell.setBackgroundColor(COLOR_SEAL_BG);
        sealCell.setBorderColor(COLOR_ACCENT);
        sealCell.setBorderWidth(1f);
        sealCell.setPadding(5f);
        sealCell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph pSealBadge = new Paragraph("★ DISTRIBUTION ACADEMY ★", FONT_SEAL_TITLE);
        pSealBadge.setAlignment(Element.ALIGN_CENTER);
        sealCell.addElement(pSealBadge);

        Paragraph pSealMain = new Paragraph("SELLO DIGITAL DE CERTIFICACIÓN", FONT_SEAL_MAIN);
        pSealMain.setAlignment(Element.ALIGN_CENTER);
        pSealMain.setSpacingBefore(1f);
        sealCell.addElement(pSealMain);

        Paragraph pSealSub = new Paragraph("REGISTRO TELEMÁTICO OFICIAL", FONT_SEAL_SUB);
        pSealSub.setAlignment(Element.ALIGN_CENTER);
        pSealSub.setSpacingBefore(1f);
        sealCell.addElement(pSealSub);

        Paragraph pSealCode = new Paragraph("AUDIT ID: VERIFIED & COMPLIANT", FONT_SEAL_CODE);
        pSealCode.setAlignment(Element.ALIGN_CENTER);
        pSealCode.setSpacingBefore(2f);
        sealCell.addElement(pSealCode);

        sealTable.addCell(sealCell);
        return sealTable;
    }

    private void addSignatureToCell(PdfPCell cell, String signatureData, String roleLabel, String personName) {
        try {
            byte[] imageBytes = resolveImageBytes(signatureData);
            if (imageBytes != null && imageBytes.length > 0) {
                Image img = Image.getInstance(imageBytes);
                img.scaleToFit(120, 36);
                img.setAlignment(Element.ALIGN_CENTER);
                cell.addElement(img);
            } else {
                Paragraph pEmpty = new Paragraph(" ", FONT_SIG_ROLE);
                pEmpty.setSpacingBefore(24f);
                cell.addElement(pEmpty);
            }
        } catch (Exception e) {
            logger.error("Error parsing signature image: {}", e.getMessage());
            Paragraph pEmpty = new Paragraph(" ", FONT_SIG_ROLE);
            pEmpty.setSpacingBefore(24f);
            cell.addElement(pEmpty);
        }

        Paragraph pLine = new Paragraph("____________________________________", FONT_LINE);
        pLine.setAlignment(Element.ALIGN_CENTER);
        pLine.setSpacingBefore(2f);
        cell.addElement(pLine);

        Paragraph pName = new Paragraph(personName, FONT_SIG_NAME);
        pName.setAlignment(Element.ALIGN_CENTER);
        pName.setSpacingBefore(2f);
        cell.addElement(pName);

        Paragraph pRole = new Paragraph(roleLabel, FONT_SIG_ROLE);
        pRole.setAlignment(Element.ALIGN_CENTER);
        pRole.setSpacingBefore(1f);
        cell.addElement(pRole);
    }

    private void addSignaturePlaceholder(PdfPCell cell, String roleLabel, String personName) {
        Paragraph pEmpty = new Paragraph(" ", FONT_SIG_ROLE);
        pEmpty.setSpacingBefore(24f);
        cell.addElement(pEmpty);

        Paragraph pLine = new Paragraph("____________________________________", FONT_LINE);
        pLine.setAlignment(Element.ALIGN_CENTER);
        pLine.setSpacingBefore(2f);
        cell.addElement(pLine);

        Paragraph pName = new Paragraph(personName, FONT_SIG_NAME);
        pName.setAlignment(Element.ALIGN_CENTER);
        pName.setSpacingBefore(2f);
        cell.addElement(pName);

        Paragraph pRole = new Paragraph(roleLabel, FONT_SIG_ROLE);
        pRole.setAlignment(Element.ALIGN_CENTER);
        pRole.setSpacingBefore(1f);
        cell.addElement(pRole);
    }

    private String formatDate(LocalDateTime date) {
        if (date == null) {
            return "Fecha no especificada";
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", Locale.of("es", "ES"));
        return date.format(formatter);
    }

    private String formatScheduleAndDuration(LocalDateTime checkInDate, LocalDateTime checkOutDate) {
        if (checkInDate == null) {
            return "Jornada formativa oficial";
        }
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");
        String checkInStr = checkInDate.format(timeFmt);

        if (checkOutDate != null) {
            String checkOutStr = checkOutDate.format(timeFmt);
            Duration duration = Duration.between(checkInDate.atZone(ZoneId.systemDefault()), checkOutDate.atZone(ZoneId.systemDefault()));
            long hours = duration.toHours();
            long minutes = duration.toMinutes() % 60;

            String durStr;
            if (hours > 0 && minutes > 0) {
                durStr = String.format(Locale.of("es", "ES"), "%d h %02d min", hours, minutes);
            } else if (hours > 0) {
                durStr = String.format(Locale.of("es", "ES"), "%d h", hours);
            } else if (minutes > 0) {
                durStr = minutes + " min";
            } else {
                durStr = "< 1 min";
            }
            return checkInStr + " - " + checkOutStr + " (" + durStr + ")";
        } else {
            return checkInStr + " h (Sesión completada)";
        }
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private byte[] resolveImageBytes(String signatureFileName) {
        if (signatureFileName.startsWith("data:image")) {
            String[] parts = signatureFileName.split(",", 2);
            if (parts.length < 2) {
                logger.error("Invalid data URL format for signature image");
                return new byte[0];
            }
            try {
                return Base64.getDecoder().decode(parts[1]);
            } catch (IllegalArgumentException e) {
                return Base64.getUrlDecoder().decode(parts[1]);
            }
        } else {
            return signatureStorageService.loadSignature(signatureFileName);
        }
    }
}