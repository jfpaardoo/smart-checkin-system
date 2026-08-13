package org.springframework.samples.smartcheckin.exports;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.awt.Color;

import org.knowm.xchart.BitmapEncoder;
import org.knowm.xchart.BitmapEncoder.BitmapFormat;
import org.knowm.xchart.PieChart;
import org.knowm.xchart.PieChartBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.stereotype.Service;

import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

@Service
public class PdfReportGenerator {

    private static final Logger logger = LoggerFactory.getLogger(PdfReportGenerator.class);

    public byte[] generateAuditLogPdf(List<AuditLog> logs) {
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
            Font tableBodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font hashFont = FontFactory.getFont(FontFactory.COURIER, 8);

            Paragraph title = new Paragraph("Registro de Auditoría y Trazabilidad (Advanced Audit)", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1.5f, 1.5f, 4f, 1.5f});

            addTableHeader(table, tableHeaderFont, "Timestamp", "Action", "Details", "IP Address");

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
            StringBuilder rawDataForHash = new StringBuilder();

            // Guard against null logs list
            List<AuditLog> safeLogs = logs != null ? logs : List.of();

            for (AuditLog log : safeLogs) {
                if (log == null) continue;
                
                String timestampStr = log.getTimestamp() != null ? log.getTimestamp().format(formatter) : "";
                String actionStr = log.getAction() != null ? log.getAction() : "";
                String detailsStr = log.getDetails() != null ? log.getDetails() : "";
                String ipStr = log.getIpAddress() != null ? log.getIpAddress() : "";
                
                table.addCell(new Phrase(timestampStr, tableBodyFont));
                table.addCell(new Phrase(actionStr, tableBodyFont));
                table.addCell(new Phrase(detailsStr, tableBodyFont));
                table.addCell(new Phrase(ipStr, tableBodyFont));
                
                rawDataForHash.append(timestampStr).append(actionStr).append(ipStr);
            }

            document.add(table);

            String hash = org.springframework.samples.smartcheckin.util.HashUtils.generateHash(rawDataForHash.toString());
            Paragraph hashPara = new Paragraph("\n\nSello de Verificación Digital (SHA-256):\n" + hash, hashFont);
            hashPara.setAlignment(Element.ALIGN_CENTER);
            document.add(hashPara);

            document.close();
        } catch (Exception ex) {
            logger.error("Error generating Audit PDF", ex);
        }

        return out.toByteArray();
    }

    private void addTableHeader(PdfPTable table, Font font, String... headers) {
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, font));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }
    }

    public byte[] generateHrReportPdf(int totalUsers, int totalFormations, int activeCheckins, int checkinsToday) {
        Document document = new Document();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 12);

            Paragraph title = new Paragraph("Reporte Ejecutivo de Recursos Humanos", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(30);
            document.add(title);

            document.add(new Paragraph("Resumen de Estadísticas Generales:", headerFont));
            document.add(new Paragraph("Total de Usuarios en Sistema: " + totalUsers, normalFont));
            document.add(new Paragraph("Total de Formaciones Registradas: " + totalFormations, normalFont));
            document.add(new Paragraph("Trabajadores Activos (Check-in actual): " + activeCheckins, normalFont));
            document.add(new Paragraph("Check-ins el día de hoy: " + checkinsToday, normalFont));
            
            document.add(new Paragraph("\n"));

            // Generate Chart with XChart
            PieChart chart = new PieChartBuilder().width(600).height(400).title("Distribución de Personal").build();
            Color[] sliceColors = new Color[] { new Color(46, 134, 193), new Color(133, 193, 233) };
            chart.getStyler().setSeriesColors(sliceColors);

            chart.addSeries("Activos (Fichados)", activeCheckins);
            chart.addSeries("Inactivos", totalUsers > activeCheckins ? totalUsers - activeCheckins : 0);

            byte[] chartBytes = BitmapEncoder.getBitmapBytes(chart, BitmapFormat.PNG);
            
            Image chartImage = Image.getInstance(chartBytes);
            chartImage.setAlignment(Element.ALIGN_CENTER);
            chartImage.scaleToFit(500, 350);
            document.add(chartImage);

            document.close();
        } catch (Exception ex) {
            logger.error("Error generating HR PDF", ex);
        }

        return out.toByteArray();
    }
}