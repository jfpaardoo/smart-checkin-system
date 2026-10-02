package org.springframework.samples.smartcheckin.exports;

import java.awt.Color;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPageEventHelper;
import com.lowagie.text.pdf.PdfWriter;

public final class PdfReportStyler {

    private static final Logger logger = LoggerFactory.getLogger(PdfReportStyler.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    // Corporate Color Palette
    public static final Color COLOR_PRIMARY = new Color(30, 58, 138); // #1E3A8A Deep Navy
    public static final Color COLOR_SECONDARY = new Color(71, 85, 105); // #475569 Slate
    public static final Color COLOR_ACCENT = new Color(130, 163, 40); // #82A328 Olive Green Accent
    public static final Color COLOR_BG_ZEBRA = new Color(248, 250, 252); // #F8FAFC
    public static final Color COLOR_BORDER = new Color(226, 232, 240); // #E2E8F0
    public static final Color COLOR_CARD_BG = new Color(241, 245, 249); // #F1F5F9
    public static final Color COLOR_SUCCESS = new Color(22, 163, 74); // #16A34A
    public static final Color COLOR_WARNING = new Color(217, 119, 6); // #D97706

    // Fonts
    public static final Font FONT_TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.WHITE);
    public static final Font FONT_SUBTITLE = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(226, 232, 240));
    public static final Font FONT_SECTION = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, COLOR_PRIMARY);
    public static final Font FONT_TH = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE);
    public static final Font FONT_TD = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(30, 41, 59));
    public static final Font FONT_TD_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, new Color(30, 41, 59));
    public static final Font FONT_CARD_VAL = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, COLOR_PRIMARY);
    public static final Font FONT_CARD_LBL = FontFactory.getFont(FontFactory.HELVETICA, 8, COLOR_SECONDARY);
    public static final Font FONT_FOOTER = FontFactory.getFont(FontFactory.HELVETICA, 8, new Color(148, 163, 184));
    public static final Font FONT_HASH = FontFactory.getFont(FontFactory.COURIER, 7, new Color(71, 85, 105));

    private PdfReportStyler() {
        // Utility class
    }

    public static class HeaderFooterPageEvent extends PdfPageEventHelper {
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

    public static void addHeaderBanner(Document document, String title, String subtitle) throws DocumentException {
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

    public static void addKpiCard(PdfPTable table, String value, String label) {
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

    public static void addTableHeader(PdfPTable table, String... headers) {
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

    public static void addTableCell(PdfPTable table, String text, Font font, int align, boolean isZebra) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "", font));
        cell.setBackgroundColor(isZebra ? COLOR_BG_ZEBRA : Color.WHITE);
        cell.setBorderColor(COLOR_BORDER);
        cell.setBorderWidth(0.5f);
        cell.setPadding(5);
        cell.setHorizontalAlignment(align);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }

    public static void addInfoRow(PdfPTable table, String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(3);
        Paragraph p = new Paragraph();
        p.add(new Phrase(label + " ", FONT_TD_BOLD));
        p.add(new Phrase(value, FONT_TD));
        cell.addElement(p);
        table.addCell(cell);
    }

    public static String safe(String value) {
        return value != null ? value : "";
    }
}
