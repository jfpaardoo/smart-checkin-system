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
import org.springframework.samples.smartcheckin.analytics.UserFormationDetailDTO;
import org.springframework.samples.smartcheckin.analytics.UserFormationExportDTO;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.checkin.CheckinType;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.formation.FormationAttendance;
import org.springframework.samples.smartcheckin.exports.strategy.ExportUtils;
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
    private static final String HEADER_FORMATION = "Formación";
    private static final String HEADER_FORMATION_DATE = "Fecha Curso";
    private static final String HEADER_EMPLOYEE = "Empleado";
    private static final String HEADER_CHECK_IN = "Entrada";
    private static final String HEADER_CHECK_OUT = "Salida";
    private static final String HEADER_SIGNATURE = "Firma";
    private static final String PERCENT_FORMAT = "%.1f%%";
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
        double avgRate;
        avgRate = users.stream()
                .mapToDouble(u -> u.getAttendancePercentage() != null ? u.getAttendancePercentage() : 0.0)
                .average().orElse(0.0);
        long totalMinutes = users.stream().mapToLong(u -> u.getTotalFormationMinutes() != null ? u.getTotalFormationMinutes() : 0).sum();

        PdfPTable kpiTable = new PdfPTable(4);
        kpiTable.setWidthPercentage(100);
        kpiTable.setSpacingAfter(15);
        addKpiCard(kpiTable, String.valueOf(total), "Total Empleados");
        addKpiCard(kpiTable, String.valueOf(currentlyWorking), "Actualmente Fichados");
        addKpiCard(kpiTable, String.format(PERCENT_FORMAT, avgRate), "Asistencia Media a Cursos");
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
        boolean isWorking = Boolean.TRUE.equals(u.getIsWorking());
        long workMins = u.getTotalWorkMinutes() != null ? u.getTotalWorkMinutes() : 0;
        String hoursStr = (workMins / 60) + "h " + (workMins % 60) + "m";
        double rate = u.getAttendancePercentage() != null ? u.getAttendancePercentage() : 0.0;

        addTableCell(table, String.valueOf(u.getUserId() != null ? u.getUserId() : 0), FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, safe(u.getUsername()), FONT_TD_BOLD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, safe(u.getPersonalCode()), FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, safe(u.getLocator()), FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, fullName, FONT_TD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, safe(u.getCompanyName()), FONT_TD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, safe(u.getAuthority()), FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, isWorking ? "ACTIVO" : "INACTIVO", isWorking ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_SUCCESS) : FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, String.format(PERCENT_FORMAT, rate), FONT_TD, Element.ALIGN_RIGHT, isZebra);
        addTableCell(table, hoursStr, FONT_TD, Element.ALIGN_RIGHT, isZebra);
    }

    public byte[] generateCheckinsPdf(List<Checkin> checkins) {
        Document document = new Document(PageSize.A4, 20, 20, 20, 30);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new HeaderFooterPageEvent("Informe General de Fichajes"));
            document.open();

            addHeaderBanner(document, "Informe de Fichajes y Registro de Jornada", "Control Horario y Presencialidad");

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
        int total = checkins.size();
        long entradas = checkins.stream().filter(c -> c.getCheckInType() == CheckinType.ENTRADA).count();
        long salidas = checkins.stream().filter(c -> c.getCheckInType() == CheckinType.SALIDA).count();
        long withSignature = checkins.stream().filter(c -> c.getSignature() != null && !c.getSignature().trim().isEmpty()).count();

        PdfPTable kpiTable = new PdfPTable(4);
        kpiTable.setWidthPercentage(100);
        kpiTable.setSpacingAfter(15);
        addKpiCard(kpiTable, String.valueOf(total), "Fichajes Totales");
        addKpiCard(kpiTable, String.valueOf(entradas), "Entradas Registradas");
        addKpiCard(kpiTable, String.valueOf(salidas), "Salidas Registradas");
        addKpiCard(kpiTable, String.valueOf(withSignature), "Fichajes con Firma");
        document.add(kpiTable);
    }

    private void renderCheckinsTable(Document document, List<Checkin> checkins) throws DocumentException {
        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{0.8f, 1.6f, 1.1f, 2f, 1.8f, 1.2f, 1.5f});

        addTableHeader(table, "ID", HEADER_USER, "Código", "Nombre Completo", HEADER_COMPANY, "Tipo", "Fecha / Hora");

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
        Font typeFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8,
                (c.getCheckInType() == CheckinType.ENTRADA) ? COLOR_SUCCESS : COLOR_WARNING);
        String ts = c.getCheckInDate() != null ? c.getCheckInDate().format(DATE_FORMATTER) : NOT_AVAILABLE;

        addTableCell(table, String.valueOf(c.getId() != null ? c.getId() : 0), FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, username, FONT_TD_BOLD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, pCode, FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, fullName, FONT_TD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, company, FONT_TD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, typeStr, typeFont, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, ts, FONT_TD, Element.ALIGN_CENTER, isZebra);
    }

    public byte[] generateFormationsPdf(List<Formation> formations) {
        Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 30);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new HeaderFooterPageEvent("Registro Oficial de Asistencias a Formación"));
            document.open();

            addHeaderBanner(document, "Registro Oficial de Formaciones y Asistencias", "Expediente de Cumplimiento Normativo");

            List<Formation> safeFormations = formations != null ? formations : List.of();
            renderFormationsKpis(document, safeFormations);
            renderFormationsTable(document, safeFormations);

            document.close();
        } catch (Exception ex) {
            logger.error("Error generating Formations PDF", ex);
        }

        return out.toByteArray();
    }

    private void renderFormationsKpis(Document document, List<Formation> formations) throws DocumentException {
        int totalFormations = formations.size();
        long totalAttendances = formations.stream().mapToLong(f -> f.getAttendances() != null ? f.getAttendances().size() : 0).sum();
        long signedAttendances = formations.stream()
                .filter(f -> f.getAttendances() != null)
                .flatMap(f -> f.getAttendances().stream())
                .filter(a -> a.getSignature() != null && !a.getSignature().trim().isEmpty())
                .count();

        PdfPTable kpiTable = new PdfPTable(3);
        kpiTable.setWidthPercentage(100);
        kpiTable.setSpacingAfter(15);
        addKpiCard(kpiTable, String.valueOf(totalFormations), "Cursos Programados");
        addKpiCard(kpiTable, String.valueOf(totalAttendances), "Asistencias Registradas");
        addKpiCard(kpiTable, String.valueOf(signedAttendances), "Firmas Digitales Verificadas");
        document.add(kpiTable);
    }

    private void renderFormationsTable(Document document, List<Formation> formations) throws DocumentException {
        PdfPTable table = new PdfPTable(9);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.8f, 1.4f, 1.8f, 1.2f, 1.3f, 1.3f, 0.8f, 0.7f, 2.5f});

        addTableHeader(table, HEADER_FORMATION, HEADER_FORMATION_DATE, HEADER_EMPLOYEE, HEADER_COMPANY, HEADER_CHECK_IN, HEADER_CHECK_OUT, "Min.", HEADER_SIGNATURE, "Sello SHA-256");

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

            String hash = HashUtils.generateHash(rawDataForHash.toString());
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

    // ─── 6. User Formations Detailed Matrix PDF ───────────────────────────────

    public byte[] generateUserFormationsPdf(List<UserFormationExportDTO> records) {
        Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 30);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            writer.setPageEvent(new HeaderFooterPageEvent("Informe Detallado de Asistencias a Formaciones"));
            document.open();

            addHeaderBanner(document, "Informe de Asistencia a Formaciones por Empleado", DISTRIBUTION_ACADEMY);

            List<UserFormationExportDTO> safeRecords = records != null ? records : List.of();
            renderUserFormationsKpis(document, safeRecords);

            Paragraph secTitle = new Paragraph("Detalle de Asistencias, Tiempos Dedicados y Sellos de Integridad", FONT_SECTION);
            secTitle.setSpacingAfter(8);
            document.add(secTitle);

            renderUserFormationsTable(document, safeRecords);

            document.close();
        } catch (Exception ex) {
            logger.error("Error generating User Formations PDF", ex);
        }

        return out.toByteArray();
    }

    private void renderUserFormationsKpis(Document document, List<UserFormationExportDTO> records) throws DocumentException {
        int total = records.size();
        long attended = records.stream().filter(r -> "ASISTIÓ".equalsIgnoreCase(r.getStatus())).count();
        long totalMins = records.stream().mapToLong(r -> r.getDurationMinutes() != null ? r.getDurationMinutes() : 0).sum();
        long signed = records.stream().filter(r -> Boolean.TRUE.equals(r.getHasSignature())).count();

        PdfPTable kpiTable = new PdfPTable(4);
        kpiTable.setWidthPercentage(100);
        kpiTable.setSpacingAfter(15);
        addKpiCard(kpiTable, String.valueOf(total), "Registros Totales");
        addKpiCard(kpiTable, String.valueOf(attended), "Asistencias Completadas");
        addKpiCard(kpiTable, (totalMins / 60) + "h " + (totalMins % 60) + "m", "Horas Formativas Totales");
        addKpiCard(kpiTable, String.valueOf(signed), "Firmas Digitales");
        document.add(kpiTable);
    }

    private void renderUserFormationsTable(Document document, List<UserFormationExportDTO> records) throws DocumentException {
        PdfPTable table = new PdfPTable(10);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.5f, 0.7f, 1.2f, 1.6f, 1.2f, 1.1f, 1.1f, 1.1f, 0.9f, 0.6f});

        addTableHeader(table, HEADER_EMPLOYEE, "Sede", HEADER_COMPANY, HEADER_FORMATION, HEADER_FORMATION_DATE, HEADER_CHECK_IN, HEADER_CHECK_OUT, "Horas (Min)", "Estado", HEADER_SIGNATURE);

        int idx = 0;
        for (UserFormationExportDTO r : records) {
            boolean isZebra = (idx++ % 2 == 1);
            renderUserFormationRow(table, r, isZebra);
        }

        document.add(table);
    }

    private void renderUserFormationRow(PdfPTable table, UserFormationExportDTO r, boolean isZebra) {
        String emp = (safe(r.getFullName()) + " (" + safe(r.getPersonalCode()) + ")").trim();
        String loc = safe(r.getLocator());
        String comp = safe(r.getCompanyName());
        String fName = safe(r.getFormationName());
        String sDate = r.getFormationDate() != null ? r.getFormationDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
        String cIn = r.getCheckInDate() != null ? r.getCheckInDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
        String cOut = r.getCheckOutDate() != null ? r.getCheckOutDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
        String dur = safe(r.getDurationHoursFormatted());
        String status = safe(r.getStatus());
        boolean hasSig = Boolean.TRUE.equals(r.getHasSignature());

        Font statusFont = resolveStatusFont(status);

        addTableCell(table, emp, FONT_TD_BOLD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, loc, FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, comp, FONT_TD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, fName, FONT_TD, Element.ALIGN_LEFT, isZebra);
        addTableCell(table, sDate, FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, cIn, FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, cOut, FONT_TD, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, dur, FONT_TD, Element.ALIGN_RIGHT, isZebra);
        addTableCell(table, status, statusFont, Element.ALIGN_CENTER, isZebra);
        addTableCell(table, hasSig ? "SÍ" : "NO", hasSig ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_SUCCESS) : FONT_TD, Element.ALIGN_CENTER, isZebra);
    }

    private Font resolveStatusFont(String status) {
        if ("ASISTIÓ".equalsIgnoreCase(status)) {
            return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_SUCCESS);
        }
        if ("EN CURSO".equalsIgnoreCase(status)) {
            return FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_WARNING);
        }
        return FONT_TD;
    }

    // ─── 7. Single User Dossier PDF ───────────────────────────────────────────

    public byte[] generateSingleUserDossierPdf(UserAnalyticsDTO user, List<UserFormationDetailDTO> details) {
        Document document = new Document(PageSize.A4, 20, 20, 20, 30);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            String userName = user != null ? (safe(user.getFirstName()) + " " + safe(user.getLastName())).trim() : HEADER_EMPLOYEE;
            writer.setPageEvent(new HeaderFooterPageEvent("Expediente Formativo - " + userName));
            document.open();

            renderDossierInfoBox(document, user, userName);
            renderDossierKpis(document, user);
            renderDossierHistoryTable(document, details);

            document.close();
        } catch (Exception ex) {
            logger.error("Error generating User Dossier PDF", ex);
        }

        return out.toByteArray();
    }

    private void renderDossierInfoBox(Document document, UserAnalyticsDTO user, String userName) throws DocumentException {
        addHeaderBanner(document, "Expediente de Formación y Asistencias", "Empleado: " + userName + " (" + (user != null ? safe(user.getPersonalCode()) : "") + ")");

        PdfPTable infoTable = new PdfPTable(2);
        infoTable.setWidthPercentage(100);
        infoTable.setWidths(new float[]{1f, 1f});
        infoTable.setSpacingAfter(15);

        addInfoRow(infoTable, "Empresa / Centro:", user != null && user.getCompanyName() != null ? user.getCompanyName() : NOT_AVAILABLE);
        addInfoRow(infoTable, "Sede / Localizador:", user != null && user.getLocator() != null ? user.getLocator() : NOT_AVAILABLE);
        addInfoRow(infoTable, "Rol en el Sistema:", user != null && user.getAuthority() != null ? user.getAuthority() : NOT_AVAILABLE);
        addInfoRow(infoTable, "Estado de Jornada:", user != null && Boolean.TRUE.equals(user.getIsWorking()) ? "Activo (Trabajando)" : "Inactivo");
        document.add(infoTable);
    }

    private void renderDossierKpis(Document document, UserAnalyticsDTO user) throws DocumentException {
        PdfPTable kpiTable = new PdfPTable(4);
        kpiTable.setWidthPercentage(100);
        kpiTable.setSpacingAfter(15);
        int assigned = user != null && user.getFormationsAssigned() != null ? user.getFormationsAssigned() : 0;
        int attended = user != null && user.getFormationsAttended() != null ? user.getFormationsAttended() : 0;
        double rate = user != null && user.getAttendancePercentage() != null ? user.getAttendancePercentage() : 0.0;
        long fMins = user != null && user.getTotalFormationMinutes() != null ? user.getTotalFormationMinutes() : 0;

        addKpiCard(kpiTable, String.valueOf(assigned), "Cursos Asignados");
        addKpiCard(kpiTable, String.valueOf(attended), "Cursos Asistidos");
        addKpiCard(kpiTable, String.format(java.util.Locale.US, PERCENT_FORMAT, rate), "Tasa Asistencia");
        addKpiCard(kpiTable, (fMins / 60) + "h " + (fMins % 60) + "m", "Tiempo en Formación");
        document.add(kpiTable);
    }

    private void renderDossierHistoryTable(Document document, List<UserFormationDetailDTO> details) throws DocumentException {
        Paragraph secTitle = new Paragraph("Historial de Formaciones Realizadas y Firmas Digitales", FONT_SECTION);
        secTitle.setSpacingAfter(8);
        document.add(secTitle);

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{2.2f, 1.3f, 1.1f, 1.1f, 1.1f, 0.8f});

        addTableHeader(table, HEADER_FORMATION, HEADER_FORMATION_DATE, HEADER_CHECK_IN, HEADER_CHECK_OUT, "Tiempo", HEADER_SIGNATURE);

        List<UserFormationDetailDTO> safeDetails = details != null ? details : List.of();
        int idx = 0;
        for (UserFormationDetailDTO d : safeDetails) {
            boolean isZebra = (idx++ % 2 == 1);
            String fName = safe(d.getFormationName());
            String sDate = d.getFormationDate() != null ? d.getFormationDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
            String cIn = d.getCheckInDate() != null ? d.getCheckInDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
            String cOut = d.getCheckOutDate() != null ? d.getCheckOutDate().format(DATE_FORMATTER) : NOT_AVAILABLE;
            long mins = d.getDurationMinutes() != null ? d.getDurationMinutes() : 0;
            String durStr = (mins / 60) + "h " + (mins % 60) + "m";
            boolean hasSig = Boolean.TRUE.equals(d.getHasSignature());

            addTableCell(table, fName, FONT_TD_BOLD, Element.ALIGN_LEFT, isZebra);
            addTableCell(table, sDate, FONT_TD, Element.ALIGN_CENTER, isZebra);
            addTableCell(table, cIn, FONT_TD, Element.ALIGN_CENTER, isZebra);
            addTableCell(table, cOut, FONT_TD, Element.ALIGN_CENTER, isZebra);
            addTableCell(table, durStr, FONT_TD, Element.ALIGN_RIGHT, isZebra);
            addTableCell(table, hasSig ? "FIRMADO" : "PENDIENTE", hasSig ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, COLOR_SUCCESS) : FONT_TD, Element.ALIGN_CENTER, isZebra);
        }

        document.add(table);
    }

    private void addInfoRow(PdfPTable table, String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(3);
        Paragraph p = new Paragraph();
        p.add(new Phrase(label + " ", FONT_TD_BOLD));
        p.add(new Phrase(value, FONT_TD));
        cell.addElement(p);
        table.addCell(cell);
    }

    private String safe(String value) {
        return value != null ? value : "";
    }
}