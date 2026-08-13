package org.springframework.samples.smartcheckin.exports.strategy;

import org.springframework.samples.smartcheckin.analytics.UserAnalyticsDTO;
import org.springframework.samples.smartcheckin.audit.AuditLog;
import org.springframework.samples.smartcheckin.checkin.Checkin;
import org.springframework.samples.smartcheckin.exports.PdfReportGenerator;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.stereotype.Component;

import java.util.List;
import java.io.IOException;

@Component
public class PdfExportStrategy implements DataExportStrategy {

    private final PdfReportGenerator pdfReportGenerator;

    public PdfExportStrategy(PdfReportGenerator pdfReportGenerator) {
        this.pdfReportGenerator = pdfReportGenerator;
    }

    @Override
    public byte[] exportUsers(List<UserAnalyticsDTO> users) throws IOException {
        throw new UnsupportedOperationException("PDF export for Users is not supported yet.");
    }

    @Override
    public byte[] exportCheckins(List<Checkin> checkins) throws IOException {
        throw new UnsupportedOperationException("PDF export for Checkins is not supported yet.");
    }

    @Override
    public byte[] exportFormations(List<Formation> formations) throws IOException {
        throw new UnsupportedOperationException("PDF export for Formations is not supported yet.");
    }

    @Override
    public byte[] exportAuditLogs(List<AuditLog> auditLogs) throws IOException {
        return pdfReportGenerator.generateAuditLogPdf(auditLogs);
    }

    @Override
    public String getContentType() {
        return "application/pdf";
    }

    @Override
    public String getFileExtension() {
        return "pdf";
    }
}
