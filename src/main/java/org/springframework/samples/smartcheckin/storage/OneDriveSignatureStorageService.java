package org.springframework.samples.smartcheckin.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.samples.smartcheckin.settings.adapter.CloudStorageAdapter;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.UUID;

@Service("oneDriveSignatureStorageService")
public class OneDriveSignatureStorageService implements SignatureStorageService {

    private static final Logger logger = LoggerFactory.getLogger(OneDriveSignatureStorageService.class);

    private final CloudStorageAdapter cloudStorageAdapter;

    @Autowired
    public OneDriveSignatureStorageService(CloudStorageAdapter cloudStorageAdapter) {
        this.cloudStorageAdapter = cloudStorageAdapter;
    }

    @Override
    public String saveSignature(String base64Data, String pathContext) {
        if (base64Data == null || base64Data.trim().isEmpty()) {
            return null;
        }
        try {
            String base64Image = extractBase64Image(base64Data);
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            String extension = determineFileExtension(imageBytes);
            String fileName = UUID.randomUUID().toString() + extension;
            
            return cloudStorageAdapter.uploadSignature(imageBytes, fileName, pathContext);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error saving signature to OneDrive: {}", e.getMessage(), e);
            throw new RuntimeException("Error saving signature to OneDrive", e);
        }
    }

    @Override
    public byte[] loadSignature(String reference) {
        try {
            return cloudStorageAdapter.downloadFile(reference);
        } catch (Exception e) {
            logger.error("Could not read signature file from OneDrive: {}", e.getMessage(), e);
            return new byte[0];
        }
    }

    @Override
    public boolean deleteSignature(String reference) {
        try {
            cloudStorageAdapter.deleteFile(reference);
            return true;
        } catch (Exception e) {
            logger.error("Error deleting signature file from OneDrive: {}", e.getMessage(), e);
            return false;
        }
    }

    private String extractBase64Image(String base64Data) {
        if (base64Data.length() > 700000) {
            throw new IllegalArgumentException("Signature file size exceeds maximum limit (500KB).");
        }
        if (base64Data.contains(",")) {
            String prefix = base64Data.split(",")[0];
            if (!prefix.contains("image/png") && !prefix.contains("image/jpeg")) {
                throw new IllegalArgumentException("Invalid signature image format.");
            }
            return base64Data.split(",")[1];
        }
        return base64Data;
    }

    private String determineFileExtension(byte[] imageBytes) {
        if (imageBytes.length < 4) {
            throw new IllegalArgumentException("Invalid image byte payload.");
        }
        boolean isPng = (imageBytes[0] == (byte) 0x89 && imageBytes[1] == (byte) 0x50 &&
                         imageBytes[2] == (byte) 0x4E && imageBytes[3] == (byte) 0x47);
        boolean isJpeg = (imageBytes[0] == (byte) 0xFF && imageBytes[1] == (byte) 0xD8 &&
                          imageBytes[2] == (byte) 0xFF);

        if (!isPng && !isJpeg) {
            throw new IllegalArgumentException("Payload magic bytes do not match valid PNG/JPEG header.");
        }
        return isPng ? ".png" : ".jpg";
    }
}
