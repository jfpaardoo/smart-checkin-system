package org.springframework.samples.smartcheckin.exports;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.samples.smartcheckin.formation.Formation;
import org.springframework.samples.smartcheckin.storage.SignatureStorageService;
import org.springframework.stereotype.Service;

@Service
public class OfficialFormationSheetService {

    private final OfficialFormationSheetPdfRenderer pdfRenderer;
    private final OfficialFormationSheetExcelRenderer excelRenderer;

    @Autowired
    public OfficialFormationSheetService(SignatureStorageService signatureStorageService) {
        SignatureImageHelper signatureHelper = new SignatureImageHelper(signatureStorageService);
        this.pdfRenderer = new OfficialFormationSheetPdfRenderer(signatureHelper);
        this.excelRenderer = new OfficialFormationSheetExcelRenderer(signatureHelper);
    }

    public OfficialFormationSheetService(OfficialFormationSheetPdfRenderer pdfRenderer,
                                         OfficialFormationSheetExcelRenderer excelRenderer) {
        this.pdfRenderer = pdfRenderer;
        this.excelRenderer = excelRenderer;
    }

    public byte[] generateOfficialSheetPdf(Formation formation) throws IOException {
        return pdfRenderer.renderPdf(formation);
    }

    public byte[] generateOfficialSheet(Formation formation) throws IOException {
        return excelRenderer.renderExcel(formation);
    }
}