package org.springframework.samples.smartcheckin.exports.strategy;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.samples.smartcheckin.exports.PdfReportGenerator;

class ExportFactoryTests {

    private ExportFactory factory;
    private CsvExportStrategy csvStrategy;
    private ExcelExportStrategy excelStrategy;
    private PdfExportStrategy pdfStrategy;

    @BeforeEach
    void setUp() {
        csvStrategy = new CsvExportStrategy();
        excelStrategy = new ExcelExportStrategy();
        pdfStrategy = new PdfExportStrategy(new PdfReportGenerator());
        factory = new ExportFactory(csvStrategy, excelStrategy, pdfStrategy);
    }

    // ─── Successful lookups ──────────────────────────────────────────────────

    @Test
    void getStrategy_csv_returnsCsvStrategy() {
        DataExportStrategy s = factory.getStrategy("csv");
        assertSame(csvStrategy, s);
    }

    @Test
    void getStrategy_csvUppercase_returnsCsvStrategy() {
        DataExportStrategy s = factory.getStrategy("CSV");
        assertSame(csvStrategy, s);
    }

    @Test
    void getStrategy_csvMixedCase_returnsCsvStrategy() {
        DataExportStrategy s = factory.getStrategy("Csv");
        assertSame(csvStrategy, s);
    }

    @Test
    void getStrategy_excel_returnsExcelStrategy() {
        DataExportStrategy s = factory.getStrategy("excel");
        assertSame(excelStrategy, s);
    }

    @Test
    void getStrategy_excelUppercase_returnsExcelStrategy() {
        DataExportStrategy s = factory.getStrategy("EXCEL");
        assertSame(excelStrategy, s);
    }

    @Test
    void getStrategy_pdf_returnsPdfStrategy() {
        DataExportStrategy s = factory.getStrategy("pdf");
        assertSame(pdfStrategy, s);
    }

    @Test
    void getStrategy_pdfUppercase_returnsPdfStrategy() {
        DataExportStrategy s = factory.getStrategy("PDF");
        assertSame(pdfStrategy, s);
    }

    // ─── Null format ────────────────────────────────────────────────────────

    @Test
    void getStrategy_nullFormat_throwsIllegalArgumentException() {
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> factory.getStrategy(null)
        );
        assertEquals("Export format cannot be null", ex.getMessage());
    }

    // ─── Unknown format ──────────────────────────────────────────────────────

    @Test
    void getStrategy_unknownFormat_throwsIllegalArgumentException() {
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> factory.getStrategy("xml")
        );
        assertTrue(ex.getMessage().contains("Unsupported export format"));
        assertTrue(ex.getMessage().contains("xml"));
    }

    @Test
    void getStrategy_emptyString_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> factory.getStrategy(""));
    }

    @Test
    void getStrategy_whitespaceOnlyFormat_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> factory.getStrategy("   "));
    }
}
