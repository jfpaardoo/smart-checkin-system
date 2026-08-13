package org.springframework.samples.smartcheckin.exports.strategy;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
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

    @ParameterizedTest
    @ValueSource(strings = {"csv", "CSV", "Csv"})
    void testGetStrategyCsvFormatsReturnsCsvStrategy(String format) {
        DataExportStrategy s = factory.getStrategy(format);
        assertSame(csvStrategy, s);
    }

    @ParameterizedTest
    @ValueSource(strings = {"excel", "EXCEL", "Excel"})
    void testGetStrategyExcelFormatsReturnsExcelStrategy(String format) {
        DataExportStrategy s = factory.getStrategy(format);
        assertSame(excelStrategy, s);
    }

    @ParameterizedTest
    @ValueSource(strings = {"pdf", "PDF", "Pdf"})
    void getStrategy_pdfFormats_returnsPdfStrategy(String format) {
        DataExportStrategy s = factory.getStrategy(format);
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

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    void getStrategy_blankFormats_throwsIllegalArgumentException(String format) {
        assertThrows(IllegalArgumentException.class, () -> factory.getStrategy(format));
    }
}
