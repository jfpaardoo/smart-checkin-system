package org.springframework.samples.smartcheckin.exports.strategy;

import org.springframework.samples.smartcheckin.analytics.UserAnalyticsDTO;
import org.springframework.samples.smartcheckin.analytics.UserFormationDetailDTO;
import org.springframework.samples.smartcheckin.analytics.UserFormationExportDTO;
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
        return pdfReportGenerator.generateUsersPdf(users);
    }

    @Override
    public byte[] exportCheckins(List<Checkin> checkins) throws IOException {
        return pdfReportGenerator.generateCheckinsPdf(checkins);
    }

    @Override
    public byte[] exportFormations(List<Formation> formations) throws IOException {
        return pdfReportGenerator.generateFormationsPdf(formations);
    }

    @Override
    public byte[] exportAuditLogs(List<AuditLog> auditLogs) throws IOException {
        return pdfReportGenerator.generateAuditLogPdf(auditLogs);
    }

    @Override
    public byte[] exportUserFormations(List<UserFormationExportDTO> records) throws IOException {
        return pdfReportGenerator.generateUserFormationsPdf(records);
    }

    @Override
    public byte[] exportSingleUserDossier(UserAnalyticsDTO user, List<UserFormationDetailDTO> details) throws IOException {
        return pdfReportGenerator.generateSingleUserDossierPdf(user, details);
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

