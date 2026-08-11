package org.springframework.samples.smartcheckin.exports.strategy;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class ExportFactory {

    private final Map<String, DataExportStrategy> strategies = new HashMap<>();

    public ExportFactory(CsvExportStrategy csvExportStrategy, 
                         ExcelExportStrategy excelExportStrategy, 
                         PdfExportStrategy pdfExportStrategy) {
        strategies.put("csv", csvExportStrategy);
        strategies.put("excel", excelExportStrategy);
        strategies.put("pdf", pdfExportStrategy);
    }

    public DataExportStrategy getStrategy(String format) {
        if (format == null) {
            throw new IllegalArgumentException("Export format cannot be null");
        }
        
        DataExportStrategy strategy = strategies.get(format.toLowerCase());
        
        if (strategy == null) {
            throw new IllegalArgumentException("Unsupported export format: " + format);
        }
        
        return strategy;
    }
}
