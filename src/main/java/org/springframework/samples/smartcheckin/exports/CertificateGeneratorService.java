package org.springframework.samples.smartcheckin.exports;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.Base64;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.stereotype.Service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class CertificateGeneratorService {

    private static final Logger logger = LoggerFactory.getLogger(CertificateGeneratorService.class);

    public byte[] generateCertificatePdf(FormationAttendance attendance) {
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Font Settings
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 16);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 12);
            Font hashFont = FontFactory.getFont(FontFactory.COURIER, 8);

            // Title
            Paragraph title = new Paragraph("CERTIFICADO DE ASISTENCIA A FORMACIÓN", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Subtitle
            Paragraph subtitle = new Paragraph("BA Distribution Academy", subtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(40);
            document.add(subtitle);

            // Body text
            String studentName = attendance.getUser().getFirstName() + " " + attendance.getUser().getLastName();
            String studentCode = attendance.getUser().getPersonalCode();
            String formationName = attendance.getFormation().getName();
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            String dateString = attendance.getCheckInDate() != null ? attendance.getCheckInDate().format(formatter) : "N/A";

            Paragraph body = new Paragraph(
                "Por la presente se certifica que el empleado " + studentName + " (Código: " + studentCode + ") " +
                "ha asistido a la formación:\n\n\"" + formationName + "\"\n\nRegistrado oficialmente el " + dateString + ".",
                bodyFont
            );
            body.setAlignment(Element.ALIGN_JUSTIFIED);
            body.setSpacingAfter(40);
            document.add(body);

            // Signature Image
            if (attendance.getSignature() != null && attendance.getSignature().startsWith("data:image")) {
                addSignatureImage(document, attendance.getSignature(), bodyFont);
            }

            // Generate SHA-256 Hash for Verification
            String rawData = studentCode + "-" + formationName + "-" + dateString;
            String hash = org.springframework.samples.smartcheckin.util.HashUtils.generateHash(rawData);
            
            Paragraph hashPara = new Paragraph("\n\nSello de Verificación Digital (SHA-256):\n" + hash, hashFont);
            hashPara.setAlignment(Element.ALIGN_CENTER);
            document.add(hashPara);

            document.close();
        } catch (Exception ex) {
            logger.error("Error generating certificate PDF", ex);
        }

        return out.toByteArray();
    }

    private void addSignatureImage(Document document, String signatureData, Font bodyFont) {
        try {
            String base64Image = signatureData.split(",")[1];
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            Image signatureImg = Image.getInstance(imageBytes);
            signatureImg.scaleToFit(150, 80);
            signatureImg.setAlignment(Element.ALIGN_CENTER);
            
            Paragraph sigText = new Paragraph("Firma del Empleado:", bodyFont);
            sigText.setAlignment(Element.ALIGN_CENTER);
            sigText.setSpacingAfter(10);
            
            document.add(sigText);
            document.add(signatureImg);
        } catch (Exception e) {
            logger.error("Error parsing signature image", e);
        }
    }

}
