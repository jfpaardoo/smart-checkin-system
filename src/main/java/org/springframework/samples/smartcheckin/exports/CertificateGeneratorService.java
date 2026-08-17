package org.springframework.samples.smartcheckin.exports;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.awt.Color;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.storage.SignatureStorageService;
import org.springframework.stereotype.Service;

import com.lowagie.text.Document;
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
    
    private final SignatureStorageService signatureStorageService;

    public CertificateGeneratorService(SignatureStorageService signatureStorageService) {
        this.signatureStorageService = signatureStorageService;
    }

    private static final Logger logger = LoggerFactory.getLogger(CertificateGeneratorService.class);

    private static final Color COLOR_NAVY = new Color(30, 58, 138); // #1E3A8A
    private static final Color COLOR_GOLD = new Color(217, 119, 6);  // #D97706
    private static final Color COLOR_SLATE = new Color(71, 85, 105); // #475569

    private static final Font FONT_HEADER = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, COLOR_GOLD);
    private static final Font FONT_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, COLOR_NAVY);
    private static final Font FONT_SUBTITLE = FontFactory.getFont(FontFactory.HELVETICA, 12, COLOR_SLATE);
    private static final Font FONT_STUDENT_NAME = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, COLOR_NAVY);
    private static final Font FONT_COURSE_NAME = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 15, COLOR_GOLD);
    private static final Font FONT_BODY = FontFactory.getFont(FontFactory.HELVETICA, 11, COLOR_SLATE);
    private static final Font FONT_HASH = FontFactory.getFont(FontFactory.COURIER, 7, COLOR_SLATE);

    // Diploma Border Event
    private static class DiplomaBorderEvent extends PdfPageEventHelper {
        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            float width = document.getPageSize().getWidth();
            float height = document.getPageSize().getHeight();

            // Outer Navy Border
            cb.setColorStroke(COLOR_NAVY);
            cb.setLineWidth(3f);
            cb.rectangle(20, 20, width - 40, height - 40);
            cb.stroke();

            // Inner Gold Border
            cb.setColorStroke(COLOR_GOLD);
            cb.setLineWidth(1.5f);
            cb.rectangle(26, 26, width - 52, height - 52);
            cb.stroke();
        }
    }

    public byte[] generateCertificatePdf(FormationAttendance attendance) {
        Document document = new Document(PageSize.A4.rotate(), 45, 45, 45, 45);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new DiplomaBorderEvent());
            document.open();

            // Defensive checks for null values
            if (attendance == null || attendance.getUser() == null || attendance.getFormation() == null) {
                logger.error("Invalid attendance data for certificate generation");
                Paragraph errorBody = new Paragraph("Error: Datos de asistencia insuficientes para generar el certificado.", FONT_BODY);
                document.add(errorBody);
                document.close();
                return out.toByteArray();
            }

            // Header Institution
            Paragraph orgName = new Paragraph("DISTRIBUTION ACADEMY", FONT_HEADER);
            orgName.setAlignment(Element.ALIGN_CENTER);
            orgName.setSpacingAfter(4);
            document.add(orgName);

            // Title
            Paragraph title = new Paragraph("CERTIFICADO DE ASISTENCIA Y APROVECHAMIENTO", FONT_TITLE);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(15);
            document.add(title);

            // Subtitle
            Paragraph intro = new Paragraph("Por la presente se certifica con carácter oficial que:", FONT_SUBTITLE);
            intro.setAlignment(Element.ALIGN_CENTER);
            intro.setSpacingAfter(10);
            document.add(intro);

            // Student Name
            String studentName = (safe(attendance.getUser().getFirstName()) + " " + safe(attendance.getUser().getLastName())).trim();
            if (studentName.isEmpty()) studentName = "Empleado";
            String studentCode = safe(attendance.getUser().getPersonalCode());
            String companyName = attendance.getUser().getCompany() != null && attendance.getUser().getCompany().getName() != null
                    ? attendance.getUser().getCompany().getName() : "";

            Paragraph pStudent = new Paragraph(studentName.toUpperCase(), FONT_STUDENT_NAME);
            pStudent.setAlignment(Element.ALIGN_CENTER);
            document.add(pStudent);

            String studentMeta = "Código de Empleado: " + studentCode + (companyName.isEmpty() ? "" : " | " + companyName);
            Paragraph pStudentMeta = new Paragraph(studentMeta, FONT_SUBTITLE);
            pStudentMeta.setAlignment(Element.ALIGN_CENTER);
            pStudentMeta.setSpacingAfter(14);
            document.add(pStudentMeta);

            // Course Info
            Paragraph pHasCompleted = new Paragraph("Ha asistido y completado satisfactoriamente el programa formativo:", FONT_BODY);
            pHasCompleted.setAlignment(Element.ALIGN_CENTER);
            pHasCompleted.setSpacingAfter(6);
            document.add(pHasCompleted);

            String formationName = safe(attendance.getFormation().getName());
            Paragraph pCourse = new Paragraph("\"" + formationName + "\"", FONT_COURSE_NAME);
            pCourse.setAlignment(Element.ALIGN_CENTER);
            pCourse.setSpacingAfter(12);
            document.add(pCourse);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd 'de' MMMM 'de' yyyy, HH:mm", java.util.Locale.of("es", "ES"));
            String dateString = attendance.getCheckInDate() != null ? attendance.getCheckInDate().format(formatter) : "Fecha no especificada";

            Paragraph pDate = new Paragraph("Registrado en la plataforma Smart Check-in el " + dateString + ".", FONT_BODY);
            pDate.setAlignment(Element.ALIGN_CENTER);
            pDate.setSpacingAfter(18);
            document.add(pDate);

            // Bottom Table: Signatures & Digital Hash
            PdfPTable bottomTable = new PdfPTable(2);
            bottomTable.setWidthPercentage(90);
            bottomTable.setWidths(new float[]{1.5f, 2f});
            bottomTable.setHorizontalAlignment(Element.ALIGN_CENTER);

            // Left Cell: Signature
            PdfPCell sigCell = new PdfPCell();
            sigCell.setBorder(Rectangle.NO_BORDER);
            sigCell.setHorizontalAlignment(Element.ALIGN_CENTER);

            if (attendance.getSignature() != null && !attendance.getSignature().trim().isEmpty()) {
                addSignatureToCell(sigCell, attendance.getSignature());
            } else {
                Paragraph noSig = new Paragraph("Asistencia registrada telemáticamente", FONT_BODY);
                noSig.setAlignment(Element.ALIGN_CENTER);
                sigCell.addElement(noSig);
            }
            bottomTable.addCell(sigCell);

            // Right Cell: Cryptographic Seal
            String rawData = studentCode + "-" + formationName + "-" + (attendance.getCheckInDate() != null ? attendance.getCheckInDate().toString() : "");
            String hash = org.springframework.samples.smartcheckin.util.HashUtils.generateHash(rawData);

            PdfPCell sealCell = new PdfPCell();
            sealCell.setBorder(Rectangle.NO_BORDER);
            sealCell.setHorizontalAlignment(Element.ALIGN_CENTER);

            Paragraph sealTitle = new Paragraph("Sello de Verificación Digital (SHA-256)", FONT_HEADER);
            sealTitle.setAlignment(Element.ALIGN_CENTER);
            sealCell.addElement(sealTitle);

            Paragraph hashPara = new Paragraph(hash, FONT_HASH);
            hashPara.setAlignment(Element.ALIGN_CENTER);
            hashPara.setSpacingBefore(4);
            sealCell.addElement(hashPara);

            Paragraph auditNotice = new Paragraph("Certificado inmutable verificable contra registro de auditoría", FONT_HASH);
            auditNotice.setAlignment(Element.ALIGN_CENTER);
            auditNotice.setSpacingBefore(2);
            sealCell.addElement(auditNotice);

            bottomTable.addCell(sealCell);
            document.add(bottomTable);

            document.close();
        } catch (Exception ex) {
            logger.error("Error generating certificate PDF", ex);
        }

        return out.toByteArray();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private void addSignatureToCell(PdfPCell cell, String signatureFileName) {
        try {
            byte[] imageBytes = resolveImageBytes(signatureFileName);
            if (imageBytes != null && imageBytes.length > 0) {
                Image signatureImg = Image.getInstance(imageBytes);
                signatureImg.scaleToFit(140, 50);
                signatureImg.setAlignment(Element.ALIGN_CENTER);

                Paragraph sigText = new Paragraph("Firma Digitalizada del Empleado:", FONT_BODY);
                sigText.setAlignment(Element.ALIGN_CENTER);
                sigText.setSpacingAfter(4);

                cell.addElement(sigText);
                cell.addElement(signatureImg);
            }
        } catch (Exception e) {
            logger.error("Error parsing signature image", e);
        }
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