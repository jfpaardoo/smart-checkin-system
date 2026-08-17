package org.springframework.samples.smartcheckin.exports;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.awt.Color;

import org.knowm.xchart.BitmapEncoder;
import org.knowm.xchart.BitmapEncoder.BitmapFormat;
import org.knowm.xchart.PieChart;
import org.knowm.xchart.PieChartBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.samples.smartcheckin.analytics.UserAnalyticsDTO;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.checkin.CheckinType;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.exports.strategy.ExportUtils;
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
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class PdfReportGenerator {

    private static final Logger logger = LoggerFactory.getLogger(PdfReportGenerator.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    private static final String DISTRIBUTION_ACADEMY = "Distribution Academy";
    private static final String HEADER_USER = "Usuario";
    private static final String HEADER_COMPANY = "Empresa";
    private static final String NOT_AVAILABLE = "N/A";

    // Corporate Color Palette
    private static final Color COLOR_PRIMARY = new Color(30, 58, 138); // #1E3A8A Deep Navy
    private static final Color COLOR_SECONDARY = new Color(71, 85, 105); // #475569 Slate
    private static final Color COLOR_ACCENT = new Color(130, 163, 40); // #82A328 Olive Green Accent
    private static final Color COLOR_BG_ZEBRA = new Color(248, 250, 252); // #F8FAFC
    private static final Color COLOR_BORDER = new Color(226, 232, 240); // #E2E8F0
    private static final Color COLOR_CARD_BG = new Color(241, 245, 249); // #F1F5F9
    private static final Color COLOR_SUCCESS = new Color(22, 163, 74); // #16A34A
    private static final Color COLOR_WARNING = new Color(217, 119, 6); // #D97706

    // Fonts
    private static final Font FONT_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.WHITE);
    private static final Font FONT_SUBTITLE = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(226, 232, 240));
    private static final Font FONT_SECTION = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, COLOR_PRIMARY);
    private static final Font FONT_TH = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
    private static final Font FONT_TD = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(30, 41, 59));
    private static final Font FONT_TD_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, new Color(30, 41, 59));
    private static final Font FONT_CARD_VAL = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, COLOR_PRIMARY);
    private static final Font FONT_CARD_LBL = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_SECONDARY);
    private static final Font FONT_FOOTER = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(148, 163, 184));
    private static final Font FONT_HASH = FontFactory.getFont(FontFactory.COURIER, 7, new Color(71, 85, 105));

    // Page Event for Header / Footer
    private static class HeaderFooterPageEvent extends PdfPageEventHelper {
        private final String reportTitle;

        public HeaderFooterPageEvent(String reportTitle) {
            this.reportTitle = reportTitle;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfPTable footer = new PdfPTable(2);
            try {
                footer.setWidths(new float[]{3f, 1f});
                footer.setTotalWidth(document.getPageSize().getWidth() - document.leftMargin() - document.rightMargin());

                PdfPCell leftCell = new PdfPCell(new Phrase("Smart Check-in | " + reportTitle + " - Documento Confidencial", FONT_FOOTER));
                leftCell.setBorder(Rectangle.NO_BORDER);
                leftCell.setHorizontalAlignment(Element.ALIGN_LEFT);
                footer.addCell(leftCell);

                PdfPCell rightCell = new PdfPCell(new Phrase("Página " + writer.getPageNumber(), FONT_FOOTER));
                rightCell.setBorder(Rectangle.NO_BORDER);
                rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
                footer.addCell(rightCell);

                footer.writeSelectedRows(0, -1, document.leftMargin(), document.bottomMargin() - 10, writer.getDirectContent());
            } catch (Exception e) {
                logger.error("Error drawing footer", e);
            }
        }
    }

    private void addHeaderBanner(Document document, String title, String subtitle) throws DocumentException {
        PdfPTable banner = new PdfPTable(1);
        banner.setWidthPercentage(100);
        banner.setSpacingAfter(15);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_PRIMARY);
        cell.setPadding(12);
        cell.setBorder(Rectangle.NO_BORDER);

        Paragraph pTitle = new Paragraph("SMART CHECK-IN | " + title.toUpperCase(), FONT_TITLE);
        pTitle.setAlignment(Element.ALIGN_LEFT);
        cell.addElement(pTitle);

        String genDate = "Generado el: " + LocalDateTime.now(ZoneId.systemDefault()).format(DATE_FORMATTER) + " | " + subtitle;
        Paragraph pSub = new Paragraph(genDate, FONT_SUBTITLE);
        pSub.setAlignment(Element.ALIGN_LEFT);
        pSub.setSpacingBefore(4);
        cell.addElement(pSub);

        banner.addCell(cell);
        document.add(banner);
    }

    private void addKpiCard(PdfPTable table, String value, String label) {
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COLOR_CARD_BG);
        cell.setBorderColor(COLOR_BORDER);
        cell.setBorderWidth(1f);
        cell.setPadding(8);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);

        Paragraph pVal = new Paragraph(value, FONT_CARD_VAL);
        pVal.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(pVal);

        Paragraph pLbl = new Paragraph(label, FONT_CARD_LBL);
        pLbl.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(pLbl);

        table.addCell(cell);
    }

    private void addTableHeader(PdfPTable table, String... headers) {
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(h, FONT_TH));
            cell.setBackgroundColor(COLOR_PRIMARY);
            cell.setBorderColor(COLOR_BORDER);
            cell.setPadding(6);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            table.addCell(cell);
        }
    }

    private void addTableCell(PdfPTable table, String text, Font font, int align, boolean isZebra) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setBackgroundColor(isZebra ? COLOR_BG_ZEBRA : Color.WHITE);
        cell.setBorderColor(COLOR_BORDER);
        cell.setBorderWidth(0.5f);
        cell.setPadding(5);
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }

    // ─── 1. Export Users PDF ───────────────────────────────────────────────────

    public byte[] generateUsersPdf(List<UserAnalyticsDTO> users) {
        Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 30);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new HeaderFooterPageEvent("Informe de Empleados y Analíticas"));
            document.open();

            addHeaderBanner(document, "Informe Ejecutivo de Empleados y Analíticas", DISTRIBUTION_ACADEMY);

            List<UserAnalyticsDTO> safeUsers = users != null ? users : List.of();
            renderUsersKpis(document, safeUsers);
            renderUsersTable(document, safeUsers);

            document.close();
        } catch (Exception ex) {
            logger.error("Error generating Users PDF", ex);
        }

        return out.toByteArray();
    }

    private void renderUsersKpis(Document document, List<UserAnalyticsDTO> users) throws DocumentException {
        int total = users.size();
        long currentlyWorking = users.stream().filter(u -> Boolean.TRUE.equals(u.getIsWorking())).count();
        double avgRate = 0.0;
        if (!users.isEmpty()) {
            avgRate = users.stream()
                    .mapToDouble(u -> u.getAttendancePercentage() != null ? u.getAttendancePercentage() : 0.0)
                    .average().orElse(0.0);
        }
        long totalMinutes = users.stream().mapToLong(u -> u.getTotalFormationMinutes() != null ? u.getTotalFormationMinutes() : 0).sum();

        PdfPTable kpiTable = new PdfPTable(4);
        kpiTable.setWidthPercentage(100);
        kpiTable.setSpacingAfter(15);
        addKpiCard(kpiTable, String.valueOf(total), "Total Empleados");
        addKpiCard(kpiTable, String.valueOf(currentlyWorking), "Actualmente Fichados");
        addKpiCard(kpiTable, String.format("%.1f%%", avgRate), "Asistencia Media a Cursos");
        addKpiCard(kpiTable, (totalMinutes / 60) + "h " + (totalMinutes % 60) + "m", "Horas Formativas Totales");
        document.add(kpiTable);
    }

    private void renderUsersTable(Document document, List<UserAnalyticsDTO> users) throws DocumentException {
        PdfPTable table = new PdfPTable(10);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{0.8f, 1.4f, 0.9f, 0.9f, 1.8f, 1.4f, 0.9f, 0.9f, 1f, 1.1f});

        addTableHeader(table, "ID", HEADER_USER, "Código", "Loc.", "Nombre Completo", HEADER_COMPANY, "Rol", "Estado", "Asistencia", "Total Horas");

        int idx = 0;
        for (UserAnalyticsDTO u : users) {
            boolean isZebra = (idx++ % 2 == 1);
            renderUserTableRow(table, u, isZebra);
        }

        document.add(table);
    }

    private void renderUserTableRow(PdfPTable table, UserAnalyticsDTO u, boolean isZebra) {
        String fullName = (safe(u.getFirstName()) + " " + safe(u.getLastName())).trim();
        String workingStatus = Boolean.TRUE.equals(u.getIsWorking()) ? "Activo" : "Inactivo";
        Font statusFont = Boolean.TRUE.equals(u.getIsWorking())
                ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_SUCCESS)
                : FONT_TD;
        double rate = u.getAttendancePercentage() != null ? u.getAttendancePercentage() : 0.0;
        long mins = u.getTotalFormationMinutes() != null ? u.getTotalFormationMinutes() : 0;

        addTableCell(table, String.valueOf(u.getUserId() != null ? u.getUserId() : 0), FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, u.getUsername(), FONT_TD_BOLD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, u.getPersonalCode(), FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, u.getLocator(), FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, fullName, FONT_TD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, u.getCompanyName() != null ? u.getCompanyName() : NOT_AVAILABLE, FONT_TD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, u.getAuthority() != null ? u.getAuthority() : NOT_AVAILABLE, FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, workingStatus, statusFont, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, String.format("%.1f%%", rate), FONT_TD, Element.ALIGN_RIGHT, isZebra);
        addTableCell(table, (mins / 60) + "h " + (mins % 60) + "m", FONT_TD, Element.ALIGN_RIGHT, isZebra);
    }

    // ─── 2. Export Checkins PDF ───────────────────────────────────────────────

    public byte[] generateCheckinsPdf(List<Checkin> checkins) {
        Document document = new Document(PageSize.A4, 20, 20, 20, 30);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new HeaderFooterPageEvent("Registro General de Fichajes"));
            document.open();

            addHeaderBanner(document, "Registro y Control de Fichajes", DISTRIBUTION_ACADEMY);

            List<Checkin> safeCheckins = checkins != null ? checkins : List.of();
            renderCheckinsKpis(document, safeCheckins);
            renderCheckinsTable(document, safeCheckins);

            document.close();
        } catch (Exception ex) {
            logger.error("Error generating Checkins PDF", ex);
        }

        return out.toByteArray();
    }

    private void renderCheckinsKpis(Document document, List<Checkin> checkins) throws DocumentException {
        long totalIns = checkins.stream().filter(c -> c.getCheckInType() == CheckinType.ENTRADA).count();
        long totalOuts = checkins.stream().filter(c -> c.getCheckInType() == CheckinType.SALIDA).count();
        long signed = checkins.stream().filter(c -> c.getSignature() != null && !c.getSignature().trim().isEmpty()).count();

        PdfPTable kpiTable = new PdfPTable(4);
        kpiTable.setWidthPercentage(100);
        kpiTable.setSpacingAfter(15);
        addKpiCard(kpiTable, String.valueOf(checkins.size()), "Total Fichajes");
        addKpiCard(kpiTable, String.valueOf(totalIns), "Entradas");
        addKpiCard(kpiTable, String.valueOf(totalOuts), "Salidas");
        addKpiCard(kpiTable, String.valueOf(signed), "Firmas Registradas");
        document.add(kpiTable);
    }

    private void renderCheckinsTable(Document document, List<Checkin> checkins) throws DocumentException {
        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{0.8f, 1.4f, 1f, 2f, 1.5f, 1.1f, 1.6f});

        addTableHeader(table, "ID", HEADER_USER, "Código", "Nombre", HEADER_COMPANY, "Tipo", "Fecha / Hora");

        int idx = 0;
        for (Checkin c : checkins) {
            boolean isZebra = (idx++ % 2 == 1);
            renderCheckinTableRow(table, c, isZebra);
        }

        document.add(table);
    }

    private void renderCheckinTableRow(PdfPTable table, Checkin c, boolean isZebra) {
        String username = c.getUser() != null && c.getUser().getUsername() != null ? c.getUser().getUsername() : NOT_AVAILABLE;
        String pCode = c.getUser() != null && c.getUser().getPersonalCode() != null ? c.getUser().getPersonalCode() : NOT_AVAILABLE;
        String fullName = c.getUser() != null ? (safe(c.getUser().getFirstName()) + " " + safe(c.getUser().getLastName())).trim() : NOT_AVAILABLE;
        String company = c.getUser() != null && c.getUser().getCompany() != null && c.getUser().getCompany().getName() != null
                ? c.getUser().getCompany().getName() : NOT_AVAILABLE;
        String typeStr = c.getCheckInType() != null ? c.getCheckInType().name() : NOT_AVAILABLE;
        Font typeFont = (c.getCheckInType() == CheckinType.ENTRADA)
                ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_SUCCESS)
                : FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_WARNING);
        String ts = c.getCheckInDate() != null ? c.getCheckInDate().format(DATE_FORMATTER) : NOT_AVAILABLE;

        addTableCell(table, String.valueOf(c.getId() != null ? c.getId() : 0), FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, username, FONT_TD_BOLD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, pCode, FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, fullName, FONT_TD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, company, FONT_TD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, typeStr, typeFont, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, ts, FONT_TD, Element.ALIGN_CENTER, isZebra);
    }

    // ─── 3. Export Formations PDF ─────────────────────────────────────────────

    public byte[] generateFormationsPdf(List<Formation> formations) {
        Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 30);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new HeaderFooterPageEvent("Informe de Formaciones y Asistencias"));
            document.open();

            addHeaderBanner(document, "Informe Oficial de Formaciones y Asistencias", DISTRIBUTION_ACADEMY);

            List<Formation> safeFormations = formations != null ? formations : List.of();
            renderFormationsKpis(document, safeFormations);

            Paragraph secTitle = new Paragraph("Detalle de Asistencias y Sellos de Integridad Digital", FONT_SECTION);
            secTitle.setSpacingAfter(8);
            document.add(secTitle);

            renderFormationsTable(document, safeFormations);

            document.close();
        } catch (Exception ex) {
            logger.error("Error generating Formations PDF", ex);
        }

        return out.toByteArray();
    }

    private void renderFormationsKpis(Document document, List<Formation> formations) throws DocumentException {
        int totalFormations = formations.size();
        int totalAttendances = formations.stream().mapToInt(f -> f.getAttendances() != null ? f.getAttendances().size() : 0).sum();
        int completedAttendances = formations.stream().mapToInt(f -> f.getAttendances() != null
                ? (int) f.getAttendances().stream().filter(a -> a.getCheckOutDate() != null).count() : 0).sum();
        int signedAttendances = formations.stream().mapToInt(f -> f.getAttendances() != null
                ? (int) f.getAttendances().stream().filter(a -> a.getSignature() != null && !a.getSignature().trim().isEmpty()).count() : 0).sum();

        PdfPTable kpiTable = new PdfPTable(4);
        kpiTable.setWidthPercentage(100);
        kpiTable.setSpacingAfter(15);
        addKpiCard(kpiTable, String.valueOf(totalFormations), "Cursos Registrados");
        addKpiCard(kpiTable, String.valueOf(totalAttendances), "Alumnos Inscritos");
        addKpiCard(kpiTable, String.valueOf(completedAttendances), "Asistencias Completadas");
        addKpiCard(kpiTable, String.valueOf(signedAttendances), "Firmas Digitalizadas");
        document.add(kpiTable);
    }

    private void renderFormationsTable(Document document, List<Formation> formations) throws DocumentException {
        PdfPTable table = new PdfPTable(9);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.8f, 1.4f, 1.8f, 1.2f, 1.3f, 1.3f, 0.8f, 0.7f, 2.5f});

        addTableHeader(table, "Formación", "Fecha Curso", "Empleado", HEADER_COMPANY, "Entrada", "Salida", "Min.", "Firma", "Sello SHA-256");

        int idx = 0;
        for (Formation f : formations) {
            if (f.getAttendances() == null) continue;
            for (FormationAttendance att : f.getAttendances()) {
                boolean isZebra = (idx++ % 2 == 1);
                renderFormationAttendanceRow(table, f, att, isZebra);
            }
        }

        document.add(table);
    }

    private void renderFormationAttendanceRow(PdfPTable table, Formation f, FormationAttendance att, boolean isZebra) {
        String fName = f.getName() != null ? f.getName() : NOT_AVAILABLE;
        String sDate = f.getFormationDate() != null ? f.getFormationDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
        String student = att.getUser() != null ? (safe(att.getUser().getFirstName()) + " " + safe(att.getUser().getLastName()) + " (" + safe(att.getUser().getPersonalCode()) + ")").trim() : NOT_AVAILABLE;
        String comp = att.getUser() != null && att.getUser().getCompany() != null ? att.getUser().getCompany().getName() : NOT_AVAILABLE;
        String cIn = att.getCheckInDate() != null ? att.getCheckInDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
        String cOut = att.getCheckOutDate() != null ? att.getCheckOutDate().format(DATE_FORMATTER) : NOT_AVAILABLE;

        long duration = 0;
        if (att.getCheckInDate() != null && att.getCheckOutDate() != null) {
            duration = ChronoUnit.MINUTES.between(
                    att.getCheckInDate().atZone(ZoneId.systemDefault()),
                    att.getCheckOutDate().atZone(ZoneId.systemDefault()));
        }
        boolean hasSig = att.getSignature() != null && !att.getSignature().trim().isEmpty();
        String hash = ExportUtils.generateVerificationHash(att);

        addTableCell(table, fName, FONT_TD_BOLD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, sDate, FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, student, FONT_TD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, comp, FONT_TD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, cIn, FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, cOut, FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, String.valueOf(duration), FONT_TD, Element.ALIGN_RIGHT, isZebra);
        addTableCell(table, hasSig ? "SÍ" : "NO", hasSig ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_SUCCESS) : FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, hash, FONT_HASH, Element.ALIGN_LEFT, isZebra);
    }

    // ─── 4. Export Audit Log PDF ──────────────────────────────────────────────

    public byte[] generateAuditLogPdf(List<AuditLog> logs) {
        Document document = new Document(PageSize.A4, 20, 20, 20, 30);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new HeaderFooterPageEvent("Registro de Auditoría y Trazabilidad"));
            document.open();

            addHeaderBanner(document, "Auditoría de Seguridad y Trazabilidad", "Sistema Inmutable y Criptográfico");

            List<AuditLog> safeLogs = logs != null ? logs : List.of();
            renderAuditKpis(document, safeLogs);

            StringBuilder rawDataForHash = new StringBuilder();
            renderAuditTable(document, safeLogs, rawDataForHash);

            String hash = org.springframework.samples.smartcheckin.util.HashUtils.generateHash(rawDataForHash.toString());
            Paragraph hashPara = new Paragraph("\nSello de Integridad del Documento (SHA-256):\n" + hash, FONT_HASH);
            hashPara.setAlignment(Element.ALIGN_CENTER);
            document.add(hashPara);

            document.close();
        } catch (Exception ex) {
            logger.error("Error generating Audit PDF", ex);
        }

        return out.toByteArray();
    }

    private void renderAuditKpis(Document document, List<AuditLog> logs) throws DocumentException {
        long anomalies = logs.stream().filter(l -> l.getAction() != null && l.getAction().contains("ANOMALY")).count();
        long logins = logs.stream().filter(l -> l.getAction() != null && l.getAction().contains("LOGIN")).count();

        PdfPTable kpiTable = new PdfPTable(3);
        kpiTable.setWidthPercentage(100);
        kpiTable.setSpacingAfter(15);
        addKpiCard(kpiTable, String.valueOf(logs.size()), "Total Eventos Registrados");
        addKpiCard(kpiTable, String.valueOf(logins), "Inicios de Sesión");
        addKpiCard(kpiTable, String.valueOf(anomalies), "Anomalías Detectadas");
        document.add(kpiTable);
    }

    private void renderAuditTable(Document document, List<AuditLog> logs, StringBuilder rawDataForHash) throws DocumentException {
        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.5f, 1.5f, 1.2f, 3.2f, 1.4f});

        addTableHeader(table, "Fecha / Hora", "Acción", HEADER_USER, "Detalles", "Dirección IP");

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

        int idx = 0;
        for (AuditLog log : logs) {
            if (log == null) continue;
            boolean isZebra = (idx++ % 2 == 1);
            renderAuditTableRow(table, log, isZebra, formatter, rawDataForHash);
        }

        document.add(table);
    }

    private void renderAuditTableRow(PdfPTable table, AuditLog log, boolean isZebra, DateTimeFormatter formatter, StringBuilder rawDataForHash) {
        String timestampStr = log.getTimestamp() != null ? log.getTimestamp().format(formatter) : "";
        String actionStr = log.getAction() != null ? log.getAction() : "";
        String userStr = log.getUsername() != null ? log.getUsername() : "-";
        String detailsStr = log.getDetails() != null ? log.getDetails() : "";
        String ipStr = log.getIpAddress() != null ? log.getIpAddress() : "";

        Font actionFont = (actionStr.contains("ANOMALY") || actionStr.contains("FAILED"))
                ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_WARNING)
                : FONT_TD_BOLD;

        addTableCell(table, timestampStr, FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, actionStr, actionFont, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, userStr, FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, detailsStr, FONT_TD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, ipStr, FONT_TD, Element.ALIGN_CENTER, isZebra);

        rawDataForHash.append(timestampStr).append(actionStr).append(userStr).append(ipStr);
    }

    // ─── 5. HR Executive Report PDF ───────────────────────────────────────────

    public byte[] generateHrReportPdf(int totalUsers, int totalFormations, int activeCheckins, int checkinsToday) {
        Document document = new Document(PageSize.A4, 20, 20, 20, 30);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new HeaderFooterPageEvent("Reporte Ejecutivo de Recursos Humanos"));
            document.open();

            addHeaderBanner(document, "Reporte Ejecutivo de Recursos Humanos", "Resumen de Actividad General");

            // KPI Grid
            PdfPTable kpiTable = new PdfPTable(4);
            kpiTable.setWidthPercentage(100);
            kpiTable.setSpacingAfter(20);
            addKpiCard(kpiTable, String.valueOf(totalUsers), "Usuarios Registrados");
            addKpiCard(kpiTable, String.valueOf(totalFormations), "Cursos Formativos");
            addKpiCard(kpiTable, String.valueOf(activeCheckins), "Trabajadores Fichados");
            addKpiCard(kpiTable, String.valueOf(checkinsToday), "Fichajes Hoy");
            document.add(kpiTable);

            // Chart with XChart
            PieChart chart = new PieChartBuilder().width(560).height(280).title("Distribución de Personal Activo vs Inactivo").build();
            Color[] sliceColors = new Color[]{COLOR_ACCENT, new Color(148, 163, 184)};
            chart.getStyler().setSeriesColors(sliceColors);

            int safeActive = Math.max(0, activeCheckins);
            int safeTotal = Math.max(0, totalUsers);
            int inactives = Math.max(0, safeTotal - safeActive);

            chart.addSeries("Activos (Fichados)", safeActive);
            chart.addSeries("Inactivos", inactives);

            byte[] chartBytes = BitmapEncoder.getBitmapBytes(chart, BitmapFormat.PNG);
            Image chartImage = Image.getInstance(chartBytes);
            chartImage.setAlignment(Element.ALIGN_CENTER);
            chartImage.scaleToFit(480, 240);
            document.add(chartImage);

            document.close();
        } catch (Exception ex) {
            logger.error("Error generating HR PDF", ex);
        }

        return out.toByteArray();
    }

    private String safe(String value) {
        return value != null ? value : "";
    }
}