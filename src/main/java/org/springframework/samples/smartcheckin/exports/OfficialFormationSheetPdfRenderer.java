package org.springframework.samples.smartcheckin.exports;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import org.springframework.samples.smartcheckin.exports.OfficialFormationSheetEvents.BaLogoCellEvent;
import org.springframework.samples.smartcheckin.exports.OfficialFormationSheetEvents.DottedUnderlineCellEvent;
import org.springframework.samples.smartcheckin.exports.OfficialFormationSheetEvents.FixedDottedLinesCellEvent;
import org.springframework.samples.smartcheckin.exports.OfficialFormationSheetEvents.TrainerSignatureAndUnderlineCellEvent;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.user.User;
import org.springframework.stereotype.Component;

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

@Component
public class OfficialFormationSheetPdfRenderer {

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

    private final SignatureImageHelper signatureImageHelper;

    public OfficialFormationSheetPdfRenderer(SignatureImageHelper signatureImageHelper) {
        this.signatureImageHelper = signatureImageHelper;
    }

    public byte[] renderPdf(Formation formation) throws IOException {
        Document document = new Document(PageSize.A4, 18, 18, 14, 14);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();
            List<FormationAttendance> attendances = formation.getAttendances() != null ? formation.getAttendances() : List.of();
            int totalPages = Math.max(1, (int) Math.ceil(attendances.size() / 21.0));
            for (int p = 0; p < totalPages; p++) {
                if (p > 0) {
                    document.newPage();
                }
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
        byte[] sigBytes = att != null ? signatureImageHelper.extractSignaturePng(att.getSignature()) : new byte[0];

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
                byte[] trimmedSig = signatureImageHelper.trimSignatureImage(sigBytes);
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
                ? signatureImageHelper.trimSignatureImage(signatureImageHelper.extractSignaturePng(formation.getTrainerSignature()))
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
}
