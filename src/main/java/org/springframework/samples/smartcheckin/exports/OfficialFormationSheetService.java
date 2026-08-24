package org.springframework.samples.smartcheckin.exports;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

import javax.imageio.ImageIO;

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

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class OfficialFormationSheetService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd-MMM-yy", Locale.of("es", "ES"));
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final String DEFAULT_TRAINER = "VICTOR PARDO";

    private static final Font FONT_TITLE_MAIN = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14.5f, Color.BLACK);
    private static final Font FONT_SEC_HEAD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9f, Color.BLACK);
    private static final Font FONT_SEC_SUB_OBS = FontFactory.getFont(FontFactory.HELVETICA, 6.5f, Color.BLACK);
    private static final Font FONT_LBL = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, Color.BLACK);
    private static final Font FONT_LBL_ITALIC = FontFactory.getFont(FontFactory.HELVETICA_BOLDOBLIQUE, 8f, Color.BLACK);
    private static final Font FONT_VAL = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, Color.BLACK);
    private static final Font FONT_TH_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, Color.BLACK);
    private static final Font FONT_TH_SMALL = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 6.5f, Color.BLACK);
    private static final Font FONT_TD_TEXT = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.2f, Color.BLACK);
    private static final Font FONT_TD_NUM = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.2f, Color.BLACK);
    private static final Font FONT_TD_POS = FontFactory.getFont(FontFactory.HELVETICA, 7.2f, Color.BLACK);
    private static final Font FONT_CROSS = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, Color.BLACK);
    private static final Font FONT_EMPTY_CHECK = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, Color.BLACK);
    private static final Font FONT_DOC_CODE = FontFactory.getFont(FontFactory.HELVETICA, 7.5f, Color.BLACK);

    private static final String DEFAULT_ATTENDEE_PREFIX = "Asistente ";

    private final SignatureStorageService signatureStorageService;

    @Autowired
    public OfficialFormationSheetService(SignatureStorageService signatureStorageService) {
        this.signatureStorageService = signatureStorageService;
    }

    private static class BaLogoCellEvent implements com.lowagie.text.pdf.PdfPCellEvent {
        @Override
        public void cellLayout(PdfPCell cell, Rectangle position, com.lowagie.text.pdf.PdfContentByte[] canvases) {
            com.lowagie.text.pdf.PdfContentByte cb = canvases[PdfPTable.TEXTCANVAS];
            float centerX = (position.getLeft() + position.getRight()) / 2f;
            float centerY = (position.getTop() + position.getBottom()) / 2f;
            float radius = Math.min(position.getWidth(), position.getHeight()) * 0.38f;

            cb.setColorFill(Color.BLACK);
            cb.circle(centerX, centerY, radius);
            cb.fill();

            try {
                cb.beginText();
                cb.setFontAndSize(com.lowagie.text.pdf.BaseFont.createFont(com.lowagie.text.pdf.BaseFont.HELVETICA_BOLD, com.lowagie.text.pdf.BaseFont.WINANSI, false), radius * 1.02f);
                cb.setColorFill(Color.WHITE);
                cb.showTextAligned(Element.ALIGN_CENTER, "BA", centerX, centerY - radius * 0.35f, 0);
                cb.endText();
            } catch (Exception ignored) {
                // Fallback gracefully if font creation fails
            }
        }
    }

    private static class FixedDottedLinesCellEvent implements com.lowagie.text.pdf.PdfPCellEvent {
        private final int numLines;
        private final float firstLineOffset;
        private final float step;

        public FixedDottedLinesCellEvent(int numLines, float firstLineOffset, float step) {
            this.numLines = numLines;
            this.firstLineOffset = firstLineOffset;
            this.step = step;
        }

        @Override
        public void cellLayout(PdfPCell cell, Rectangle position, com.lowagie.text.pdf.PdfContentByte[] canvases) {
            com.lowagie.text.pdf.PdfContentByte cb = canvases[PdfPTable.LINECANVAS];
            cb.saveState();
            cb.setLineWidth(0.5f);
            cb.setColorStroke(new Color(150, 150, 150));
            cb.setLineDash(0.8f, 1.5f, 0f);

            float x1 = position.getLeft() + 4f;
            float x2 = position.getRight() - 4f;

            for (int i = 0; i < numLines; i++) {
                float y = position.getTop() - firstLineOffset - (i * step);
                if (y > position.getBottom() + 1f) {
                    cb.moveTo(x1, y);
                    cb.lineTo(x2, y);
                }
            }
            cb.stroke();
            cb.restoreState();
        }
    }

    private static class DottedUnderlineCellEvent implements com.lowagie.text.pdf.PdfPCellEvent {
        private final float xStartOffset;
        private final float yBottomOffset;

        public DottedUnderlineCellEvent(float xStartOffset) {
            this(xStartOffset, 1.5f);
        }

        public DottedUnderlineCellEvent(float xStartOffset, float yBottomOffset) {
            this.xStartOffset = xStartOffset;
            this.yBottomOffset = yBottomOffset;
        }

        @Override
        public void cellLayout(PdfPCell cell, Rectangle position, com.lowagie.text.pdf.PdfContentByte[] canvases) {
            com.lowagie.text.pdf.PdfContentByte cb = canvases[PdfPTable.LINECANVAS];
            cb.saveState();
            cb.setLineWidth(0.5f);
            cb.setColorStroke(new Color(140, 140, 140));
            cb.setLineDash(0.8f, 1.5f, 0f);

            float x1 = position.getLeft() + xStartOffset;
            float x2 = position.getRight() - 2f;
            float y = position.getBottom() + yBottomOffset;

            if (x2 > x1) {
                cb.moveTo(x1, y);
                cb.lineTo(x2, y);
                cb.stroke();
            }
            cb.restoreState();
        }
    }

    private static class TrainerSignatureAndUnderlineCellEvent implements com.lowagie.text.pdf.PdfPCellEvent {
        private final byte[] signatureBytes;

        public TrainerSignatureAndUnderlineCellEvent(byte[] signatureBytes) {
            this.signatureBytes = signatureBytes;
        }

        @Override
        public void cellLayout(PdfPCell cell, Rectangle position, com.lowagie.text.pdf.PdfContentByte[] canvases) {
            // 1. Línea punteada de base
            com.lowagie.text.pdf.PdfContentByte lineCb = canvases[PdfPTable.LINECANVAS];
            lineCb.saveState();
            lineCb.setLineWidth(0.5f);
            lineCb.setColorStroke(new Color(140, 140, 140));
            lineCb.setLineDash(0.8f, 1.5f, 0f);

            float x1 = position.getLeft();
            float x2 = position.getRight() - 2f;
            float y = position.getBottom() + 1.5f;

            if (x2 > x1) {
                lineCb.moveTo(x1, y);
                lineCb.lineTo(x2, y);
                lineCb.stroke();
            }
            lineCb.restoreState();

            // 2. Firma estampada y superpuesta directamente sobre el nombre (en el eje Z / 3D)
            if (signatureBytes != null && signatureBytes.length > 0) {
                try {
                    Image tImg = Image.getInstance(signatureBytes);
                    float availableH = Math.max(16f, position.getHeight() - 4f);
                    float maxW = Math.min(position.getWidth() * 0.85f, 120f);
                    float maxH = Math.min(22f, availableH);
                    tImg.scaleToFit(maxW, maxH);

                    float imgW = tImg.getScaledWidth();
                    float imgH = tImg.getScaledHeight();

                    // Centrado horizontal sobre el nombre
                    float imgX = (position.getLeft() + position.getRight() - imgW) / 2f;
                    // Posición vertical: sobrepuesta sobre el nombre y garantizando que no se salga del cuadro
                    float imgY = position.getBottom() + 1.0f;
                    if (imgY + imgH > position.getTop() - 2f) {
                        imgY = position.getTop() - 2f - imgH;
                    }
                    imgY = Math.max(position.getBottom(), imgY);

                    com.lowagie.text.pdf.PdfContentByte textCb = canvases[PdfPTable.TEXTCANVAS];
                    textCb.addImage(tImg, imgW, 0, 0, imgH, imgX, imgY);
                } catch (Exception ignored) {
                    // Fallback gracefully if image cannot be added
                }
            }
        }
    }

    public byte[] generateOfficialSheetPdf(Formation formation) throws IOException {
        Document document = new Document(PageSize.A4, 18, 18, 14, 14);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();
            List<FormationAttendance> attendances = formation.getAttendances() != null ? formation.getAttendances() : List.of();
            int totalPages = Math.max(1, (int) Math.ceil(attendances.size() / 21.0));
            for (int p = 0; p < totalPages; p++) {
                if (p > 0) document.newPage();
                renderSingleOfficialPdfPage(document, formation, attendances, p);
            }
            document.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new IOException("Error al generar el PDF oficial FOR 99: " + e.getMessage(), e);
        }
    }

    private void renderSingleOfficialPdfPage(Document document, Formation formation, List<FormationAttendance> allAttendances, int pageIndex) throws DocumentException {
        renderExactPdfHeader(document);
        renderExactPdfCourseIdentification(document, formation);
        renderExactPdfSummary(document, formation);
        int startIdx = pageIndex * 21;
        int endIdx = Math.min(startIdx + 21, allAttendances.size());
        List<FormationAttendance> pageAttendances = startIdx < allAttendances.size() ? allAttendances.subList(startIdx, endIdx) : List.of();
        renderExactPdfAttendeesTable(document, pageAttendances, startIdx);
        renderExactPdfFooter(document, formation);
    }

    private void renderExactPdfHeader(Document document) throws DocumentException {
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);
        headerTable.setWidths(new float[]{0.18f, 0.82f});
        headerTable.setSpacingAfter(4f);

        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.BOX);
        logoCell.setBorderColor(Color.BLACK);
        logoCell.setBorderWidth(1.2f);
        logoCell.setFixedHeight(48f);
        logoCell.setCellEvent(new BaLogoCellEvent());
        headerTable.addCell(logoCell);

        PdfPCell titleCell = new PdfPCell();
        titleCell.setBorder(Rectangle.BOX);
        titleCell.setBorderColor(Color.BLACK);
        titleCell.setBorderWidth(1.2f);
        titleCell.setFixedHeight(48f);
        titleCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        titleCell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph pTitle = new Paragraph("Sumario y Registro de presencias", FONT_TITLE_MAIN);
        pTitle.setAlignment(Element.ALIGN_CENTER);
        titleCell.addElement(pTitle);
        headerTable.addCell(titleCell);

        document.add(headerTable);
    }

    private void renderExactPdfCourseIdentification(Document document, Formation formation) throws DocumentException {
        Paragraph secTitle = new Paragraph("Identificación Curso", FONT_SEC_HEAD);
        secTitle.setSpacingAfter(1.5f);
        document.add(secTitle);

        PdfPTable boxTable = new PdfPTable(1);
        boxTable.setWidthPercentage(100);
        boxTable.setSpacingAfter(4f);

        PdfPCell contentCell = new PdfPCell();
        contentCell.setBorder(Rectangle.BOX);
        contentCell.setBorderColor(Color.BLACK);
        contentCell.setBorderWidth(0.75f);
        contentCell.setPadding(3.5f);

        String courseName = formation.getName() != null ? formation.getName().toUpperCase() : "";
        String dateStr = formation.getFormationDate() != null ? formation.getFormationDate().format(DATE_FMT).toLowerCase() : "";
        String startTime = formation.getFormationDate() != null ? formation.getFormationDate().format(TIME_FMT) : "";
        String endTime = formation.getFormationDate() != null ? formation.getFormationDate().plusHours(1).format(TIME_FMT) : "";
        String location = formation.getLocation() != null && !formation.getLocation().isBlank() ? formation.getLocation().toUpperCase() : "BA VILLAFRANCA";
        String trainer = formation.getTrainer() != null && !formation.getTrainer().isBlank() ? formation.getTrainer().toUpperCase() : DEFAULT_TRAINER;

        // Fila 1: Curso y Registro
        PdfPTable row1 = new PdfPTable(2);
        row1.setWidthPercentage(100);
        row1.setWidths(new float[]{0.70f, 0.30f});
        row1.setSpacingAfter(3f);
        row1.addCell(createDottedFieldCell("Curso:  ", courseName, 30f, true));
        row1.addCell(createDottedFieldCell("Registro:  ", "", 40f, false));
        contentCell.addElement(row1);

        // Fila 2: Fecha, Horas, Lugar y Duración
        PdfPTable row2 = new PdfPTable(5);
        row2.setWidthPercentage(100);
        row2.setWidths(new float[]{0.22f, 0.16f, 0.16f, 0.30f, 0.16f});
        row2.setSpacingAfter(3f);
        row2.addCell(createDottedFieldCell("Fecha:  ", dateStr, 28f, false));
        row2.addCell(createDottedFieldCell("De las:  ", startTime, 30f, false));
        row2.addCell(createDottedFieldCell("hasta las  ", endTime, 38f, false));
        row2.addCell(createDottedFieldCell("Lugar:  ", location, 28f, false));
        row2.addCell(createDottedFieldCell("Duración:  ", "1 H.", 40f, false));
        contentCell.addElement(row2);

        // Fila 3: N.º Acción, Formador y Duración Total
        PdfPTable row3 = new PdfPTable(3);
        row3.setWidthPercentage(100);
        row3.setWidths(new float[]{0.20f, 0.55f, 0.25f});
        row3.addCell(createDottedFieldCell("N.º Acción:  ", "", 44f, false));
        row3.addCell(createDottedFieldCell("Formador:  ", trainer, 42f, false));
        row3.addCell(createDottedFieldCell("Duración Total:  ", "1 H.", 60f, false));
        contentCell.addElement(row3);

        boxTable.addCell(contentCell);
        document.add(boxTable);
    }

    private PdfPCell createDottedFieldCell(String label, String value, float labelWidth, boolean boldVal) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setVerticalAlignment(Element.ALIGN_BOTTOM);
        cell.setPaddingBottom(3.5f);
        cell.setPaddingTop(1f);
        cell.setCellEvent(new DottedUnderlineCellEvent(labelWidth));

        Paragraph p = new Paragraph();
        p.setLeading(9f);
        p.add(new Phrase(label, FONT_LBL));
        if (value != null && !value.isBlank()) {
            p.add(new Phrase(value, boldVal ? FONT_VAL : FONT_LBL));
        }
        cell.addElement(p);
        return cell;
    }

    private void renderExactPdfSummary(Document document, Formation formation) throws DocumentException {
        Paragraph secTitle = new Paragraph("Sumario", FONT_SEC_HEAD);
        secTitle.setSpacingAfter(1.5f);
        document.add(secTitle);

        PdfPTable boxTable = new PdfPTable(1);
        boxTable.setWidthPercentage(100);
        boxTable.setSpacingAfter(4f);

        PdfPCell contentCell = new PdfPCell();
        contentCell.setBorder(Rectangle.BOX);
        contentCell.setBorderColor(Color.BLACK);
        contentCell.setBorderWidth(0.75f);
        contentCell.setPaddingTop(1.5f);
        contentCell.setPaddingLeft(4f);
        contentCell.setPaddingRight(4f);
        contentCell.setPaddingBottom(1.5f);
        contentCell.setFixedHeight(42f);
        contentCell.setCellEvent(new FixedDottedLinesCellEvent(4, 11.5f, 9.5f));

        String desc = formation.getDescription() != null ? formation.getDescription() : "";
        if (!desc.isBlank()) {
            Paragraph pDesc = new Paragraph(desc, FONT_LBL);
            pDesc.setLeading(9.5f);
            contentCell.addElement(pDesc);
        }

        boxTable.addCell(contentCell);
        document.add(boxTable);
    }

    private void renderExactPdfAttendeesTable(Document document, List<FormationAttendance> pageAttendances, int startIdx) throws DocumentException {
        Paragraph secTitle = new Paragraph("Formandos", FONT_SEC_HEAD);
        secTitle.setSpacingAfter(1.5f);
        document.add(secTitle);

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{0.055f, 0.40f, 0.10f, 0.225f, 0.11f, 0.11f});
        table.setSpacingAfter(4f);

        // Cabecera Fila 1
        PdfPCell cPos = createThCell("Pos.", 2, 1);
        PdfPCell cNom = createThCell("Nombre del formando", 2, 1);
        PdfPCell cNum = createThCell("Número", 2, 1);
        PdfPCell cFir = createThCell("Firma del formando", 2, 1);

        PdfPCell cEncabezadoGrupo = new PdfPCell(new Phrase("En este momento, estoy\n(márquelo con una cruz):", FONT_TH_SMALL));
        cEncabezadoGrupo.setColspan(2);
        cEncabezadoGrupo.setBorder(Rectangle.BOX);
        cEncabezadoGrupo.setBorderColor(Color.BLACK);
        cEncabezadoGrupo.setBorderWidth(0.5f);
        cEncabezadoGrupo.setHorizontalAlignment(Element.ALIGN_CENTER);
        cEncabezadoGrupo.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cEncabezadoGrupo.setPadding(1.5f);

        table.addCell(cPos);
        table.addCell(cNom);
        table.addCell(cNum);
        table.addCell(cFir);
        table.addCell(cEncabezadoGrupo);

        // Cabecera Fila 2 (subcolumnas Dentro/Fuera de trabajo)
        PdfPCell cDentro = new PdfPCell(new Phrase("Dentro del\nhorario de\ntrabajo", FONT_TH_SMALL));
        cDentro.setBorder(Rectangle.BOX);
        cDentro.setBorderColor(Color.BLACK);
        cDentro.setBorderWidth(0.5f);
        cDentro.setHorizontalAlignment(Element.ALIGN_CENTER);
        cDentro.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cDentro.setPadding(1.5f);

        PdfPCell cFuera = new PdfPCell(new Phrase("Fuera del\nhorario de\ntrabajo", FONT_TH_SMALL));
        cFuera.setBorder(Rectangle.BOX);
        cFuera.setBorderColor(Color.BLACK);
        cFuera.setBorderWidth(0.5f);
        cFuera.setHorizontalAlignment(Element.ALIGN_CENTER);
        cFuera.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cFuera.setPadding(1.5f);

        table.addCell(cDentro);
        table.addCell(cFuera);

        // Exactamente 21 filas (como en la plantilla oficial de calidad FOR 99)
        for (int i = 1; i <= 21; i++) {
            boolean hasAttendee = (i - 1) < pageAttendances.size();
            FormationAttendance att = hasAttendee ? pageAttendances.get(i - 1) : null;
            renderExactAttendanceRow(table, att, startIdx + i);
        }

        document.add(table);
    }

    private PdfPCell createThCell(String text, int rowSpan, int colSpan) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FONT_TH_BOLD));
        cell.setRowspan(rowSpan);
        cell.setColspan(colSpan);
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(Color.BLACK);
        cell.setBorderWidth(0.5f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(2f);
        return cell;
    }

    private String resolveAttendeeName(User user, int pos) {
        if (user == null) {
            return DEFAULT_ATTENDEE_PREFIX + pos;
        }
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        String fullName = (first + " " + last).trim();
        if (fullName.isEmpty()) {
            return user.getUsername() != null ? user.getUsername() : DEFAULT_ATTENDEE_PREFIX + pos;
        }
        return fullName;
    }

    private String resolvePersonalCode(User user) {
        if (user == null) {
            return "";
        }
        return user.getPersonalCode() != null ? user.getPersonalCode() : String.valueOf(user.getId());
    }

    private boolean isAttendeeInsideWork(FormationAttendance att, User user) {
        if (att == null) {
            return false;
        }
        if (att.getWithinWorkingHours() != null) {
            return Boolean.TRUE.equals(att.getWithinWorkingHours());
        }
        return user != null && !Boolean.FALSE.equals(user.getIsWorking());
    }

    private void renderExactAttendanceRow(PdfPTable table, FormationAttendance att, int pos) {
        User user = (att != null) ? att.getUser() : null;
        String fullName = att != null ? resolveAttendeeName(user, pos).toUpperCase() : "";
        String personalCode = att != null ? resolvePersonalCode(user) : "";
        boolean isInsideWork = att != null && isAttendeeInsideWork(att, user);
        boolean isOutsideWork = att != null && !isInsideWork;
        byte[] sigBytes = att != null ? extractSignaturePng(att.getSignature()) : new byte[0];

        // 1. Posición
        PdfPCell cPos = new PdfPCell(new Phrase(String.valueOf(pos), FONT_TD_POS));
        cPos.setBorder(Rectangle.BOX);
        cPos.setBorderColor(Color.BLACK);
        cPos.setBorderWidth(0.5f);
        cPos.setFixedHeight(14.5f);
        cPos.setHorizontalAlignment(Element.ALIGN_CENTER);
        cPos.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cPos);

        // 2. Nombre del formando
        PdfPCell cNom = new PdfPCell(new Phrase(fullName, FONT_TD_TEXT));
        cNom.setBorder(Rectangle.BOX);
        cNom.setBorderColor(Color.BLACK);
        cNom.setBorderWidth(0.5f);
        cNom.setFixedHeight(14.5f);
        cNom.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cNom.setPaddingLeft(3f);
        table.addCell(cNom);

        // 3. Número
        PdfPCell cNum = new PdfPCell(new Phrase(personalCode, FONT_TD_NUM));
        cNum.setBorder(Rectangle.BOX);
        cNum.setBorderColor(Color.BLACK);
        cNum.setBorderWidth(0.5f);
        cNum.setFixedHeight(14.5f);
        cNum.setHorizontalAlignment(Element.ALIGN_CENTER);
        cNum.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cNum);

        // 4. Firma del formando
        PdfPCell cFir = new PdfPCell();
        cFir.setBorder(Rectangle.BOX);
        cFir.setBorderColor(Color.BLACK);
        cFir.setBorderWidth(0.5f);
        cFir.setFixedHeight(14.5f);
        cFir.setHorizontalAlignment(Element.ALIGN_CENTER);
        cFir.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cFir.setPadding(0.5f);
        if (sigBytes.length > 0) {
            try {
                byte[] trimmedSig = trimSignatureImage(sigBytes);
                byte[] toUse = (trimmedSig != null && trimmedSig.length > 0) ? trimmedSig : sigBytes;
                Image img = Image.getInstance(toUse);
                img.scaleToFit(80f, 12f);
                img.setAlignment(Element.ALIGN_CENTER);
                cFir.addElement(img);
            } catch (Exception ignored) {
                // Fallback gracefully if signature image format is invalid
            }
        }
        table.addCell(cFir);

        // 5. Casilla Dentro del horario
        table.addCell(createExactCheckboxCell(isInsideWork));

        // 6. Casilla Fuera del horario
        table.addCell(createExactCheckboxCell(isOutsideWork));
    }

    private PdfPCell createExactCheckboxCell(boolean checked) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(Color.BLACK);
        cell.setBorderWidth(0.5f);
        cell.setFixedHeight(14.5f);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setPadding(1f);

        PdfPTable boxTable = new PdfPTable(1);
        boxTable.setTotalWidth(9.5f);
        boxTable.setLockedWidth(true);

        PdfPCell boxCell = new PdfPCell(new Phrase(checked ? "X" : " ", checked ? FONT_CROSS : FONT_EMPTY_CHECK));
        boxCell.setBorder(Rectangle.BOX);
        boxCell.setBorderColor(Color.BLACK);
        boxCell.setBorderWidth(0.6f);
        boxCell.setFixedHeight(9.5f);
        boxCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        boxCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        boxCell.setPadding(0);

        boxTable.addCell(boxCell);
        cell.addElement(boxTable);
        return cell;
    }

    private void renderExactPdfFooter(Document document, Formation formation) throws DocumentException {
        // Observaciones / Registro de incidencias (TOTALMENTE EN NEGRO)
        Paragraph secTitle = new Paragraph();
        secTitle.setSpacingAfter(1.5f);
        secTitle.add(new Phrase("Observaciones / Registro de incidencias ", FONT_SEC_HEAD));
        secTitle.add(new Phrase("(en caso de incidencia, describir la situación e identificar los intervinientes)", FONT_SEC_SUB_OBS));
        document.add(secTitle);

        PdfPTable obsTable = new PdfPTable(1);
        obsTable.setWidthPercentage(100);
        obsTable.setSpacingAfter(4f);

        PdfPCell obsCell = new PdfPCell();
        obsCell.setBorder(Rectangle.BOX);
        obsCell.setBorderColor(Color.BLACK);
        obsCell.setBorderWidth(0.75f);
        obsCell.setPaddingTop(1.5f);
        obsCell.setPaddingLeft(4f);
        obsCell.setPaddingRight(4f);
        obsCell.setPaddingBottom(1.5f);
        obsCell.setFixedHeight(38f);
        obsCell.setCellEvent(new FixedDottedLinesCellEvent(4, 10.5f, 8.8f));

        String obs = (formation.getObservations() != null && !formation.getObservations().isBlank()) ? formation.getObservations() : "";
        if (!obs.isBlank()) {
            Paragraph pObs = new Paragraph(obs, FONT_LBL);
            pObs.setLeading(8.8f);
            obsCell.addElement(pObs);
        }
        obsTable.addCell(obsCell);
        document.add(obsTable);

        // Caja de Fecha, Formador y Firma del Formador
        PdfPTable footerBoxTable = new PdfPTable(1);
        footerBoxTable.setWidthPercentage(100);
        footerBoxTable.setSpacingAfter(2f);

        PdfPCell innerFooterCell = new PdfPCell();
        innerFooterCell.setBorder(Rectangle.BOX);
        innerFooterCell.setBorderColor(Color.BLACK);
        innerFooterCell.setBorderWidth(0.75f);
        innerFooterCell.setPadding(3f);
        innerFooterCell.setFixedHeight(34f);

        PdfPTable footerContentTable = new PdfPTable(2);
        footerContentTable.setWidthPercentage(100);
        footerContentTable.setWidths(new float[]{0.38f, 0.62f});

        String dateStr = formation.getFormationDate() != null ? formation.getFormationDate().format(DATE_FMT).toLowerCase() : "";
        String trainer = formation.getTrainer() != null && !formation.getTrainer().isBlank() ? formation.getTrainer().toUpperCase() : DEFAULT_TRAINER;

        // Fecha (Texto centrado encima de la línea de puntos)
        PdfPCell dateContainerCell = new PdfPCell();
        dateContainerCell.setBorder(Rectangle.NO_BORDER);
        dateContainerCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
        dateContainerCell.setPaddingBottom(2f);
        dateContainerCell.setFixedHeight(28f);

        PdfPTable dateInnerTable = new PdfPTable(2);
        dateInnerTable.setWidthPercentage(100);
        dateInnerTable.setWidths(new float[]{0.25f, 0.75f});

        PdfPCell lblDateCell = new PdfPCell(new Phrase("Fecha:", FONT_LBL_ITALIC));
        lblDateCell.setBorder(Rectangle.NO_BORDER);
        lblDateCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
        lblDateCell.setPaddingBottom(3.5f);
        dateInnerTable.addCell(lblDateCell);

        PdfPCell dateValCell = new PdfPCell();
        dateValCell.setBorder(Rectangle.NO_BORDER);
        dateValCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        dateValCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
        dateValCell.setPaddingBottom(3.5f);
        dateValCell.setCellEvent(new DottedUnderlineCellEvent(0f, 1.5f));

        Paragraph pDate = new Paragraph(dateStr, FONT_VAL);
        pDate.setAlignment(Element.ALIGN_CENTER);
        dateValCell.addElement(pDate);
        dateInnerTable.addCell(dateValCell);

        dateContainerCell.addElement(dateInnerTable);
        footerContentTable.addCell(dateContainerCell);

        // Formador y Firma Superpuesta (en 3D / eje Z aplastando el nombre)
        PdfPCell trainerContainerCell = new PdfPCell();
        trainerContainerCell.setBorder(Rectangle.NO_BORDER);
        trainerContainerCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
        trainerContainerCell.setPaddingBottom(2f);
        trainerContainerCell.setFixedHeight(28f);

        PdfPTable trainerInnerTable = new PdfPTable(2);
        trainerInnerTable.setWidthPercentage(100);
        trainerInnerTable.setWidths(new float[]{0.22f, 0.78f});

        PdfPCell lblTrainerCell = new PdfPCell(new Phrase("Formador:", FONT_LBL_ITALIC));
        lblTrainerCell.setBorder(Rectangle.NO_BORDER);
        lblTrainerCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
        lblTrainerCell.setPaddingBottom(3.5f);
        trainerInnerTable.addCell(lblTrainerCell);

        byte[] trainerSigBytes = (formation.getTrainerSignature() != null && !formation.getTrainerSignature().isBlank())
                ? trimSignatureImage(extractSignaturePng(formation.getTrainerSignature()))
                : new byte[0];

        PdfPCell nameValCell = new PdfPCell();
        nameValCell.setBorder(Rectangle.NO_BORDER);
        nameValCell.setHorizontalAlignment(Element.ALIGN_CENTER);
        nameValCell.setVerticalAlignment(Element.ALIGN_BOTTOM);
        nameValCell.setPaddingBottom(3.5f);
        nameValCell.setCellEvent(new TrainerSignatureAndUnderlineCellEvent(trainerSigBytes));

        Paragraph pTrainerName = new Paragraph(trainer, FONT_VAL);
        pTrainerName.setAlignment(Element.ALIGN_CENTER);
        nameValCell.addElement(pTrainerName);
        trainerInnerTable.addCell(nameValCell);

        trainerContainerCell.addElement(trainerInnerTable);
        footerContentTable.addCell(trainerContainerCell);

        innerFooterCell.addElement(footerContentTable);
        footerBoxTable.addCell(innerFooterCell);
        document.add(footerBoxTable);

        Paragraph docCodePara = new Paragraph("FOR 99 HRS 103 (es)", FONT_DOC_CODE);
        docCodePara.setSpacingBefore(1f);
        document.add(docCodePara);
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
            fullName = user.getUsername() != null ? user.getUsername() : DEFAULT_ATTENDEE_PREFIX + position;
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

    private static boolean isDrawnPixel(int argb) {
        int alpha = (argb >> 24) & 0xff;
        int r = (argb >> 16) & 0xff;
        int g = (argb >> 8) & 0xff;
        int b = argb & 0xff;
        return (alpha > 20) && !(r > 240 && g > 240 && b > 240);
    }

    private static int[] calculateSignatureBounds(BufferedImage img) {
        int width = img.getWidth();
        int height = img.getHeight();
        int[] bounds = new int[]{width, height, -1, -1};

        for (int y = 0; y < height; y++) {
            updateRowBounds(img, y, width, bounds);
        }
        if (bounds[2] < bounds[0] || bounds[3] < bounds[1]) {
            return new int[0];
        }
        return bounds;
    }

    private static void updateRowBounds(BufferedImage img, int y, int width, int[] bounds) {
        for (int x = 0; x < width; x++) {
            if (isDrawnPixel(img.getRGB(x, y))) {
                bounds[0] = Math.min(bounds[0], x);
                bounds[1] = Math.min(bounds[1], y);
                bounds[2] = Math.max(bounds[2], x);
                bounds[3] = Math.max(bounds[3], y);
            }
        }
    }

    private byte[] trimSignatureImage(byte[] imageBytes) {
        if (imageBytes == null || imageBytes.length == 0) {
            return imageBytes;
        }
        try {
            ByteArrayInputStream bais = new ByteArrayInputStream(imageBytes);
            BufferedImage img = ImageIO.read(bais);
            if (img == null) {
                return imageBytes;
            }
            int[] bounds = calculateSignatureBounds(img);
            if (bounds.length == 0) {
                return imageBytes;
            }

            int minX = bounds[0];
            int minY = bounds[1];
            int maxX = bounds[2];
            int maxY = bounds[3];

            int cropX = Math.max(0, minX - 2);
            int cropY = Math.max(0, minY - 2);
            int cropW = Math.min(img.getWidth() - cropX, (maxX - minX + 1) + 4);
            int cropH = Math.min(img.getHeight() - cropY, (maxY - minY + 1) + 4);

            BufferedImage trimmed = img.getSubimage(cropX, cropY, cropW, cropH);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(trimmed, "png", baos);
            return baos.toByteArray();
        } catch (Exception e) {
            return imageBytes;
        }
    }
}