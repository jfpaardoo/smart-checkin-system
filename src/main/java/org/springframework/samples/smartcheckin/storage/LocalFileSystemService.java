package org.springframework.samples.smartcheckin.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.UUID;

@Service
public class LocalFileSystemService {

    private static final Logger logger = LoggerFactory.getLogger(LocalFileSystemService.class);

    @Value("${app.upload.dir:uploads/signatures}")
    private String uploadDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(uploadDir);
        try {
            if (!Files.exists(rootLocation)) {
                Files.createDirectories(rootLocation);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage location", e);
        }
    }

    /**
     * Saves a base64 encoded PNG signature to the file system.
     * @param base64Data The base64 string (e.g. data:image/png;base64,...)
     * @return the unique file name generated.
     */
    public String saveSignature(String base64Data) {
        if (base64Data == null || base64Data.trim().isEmpty()) {
            return null;
        }

        try {
            String base64Image = extractBase64Image(base64Data);
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);

            String extension = determineFileExtension(imageBytes);
            String fileName = UUID.randomUUID().toString() + extension;
            Path destinationFile = this.rootLocation.resolve(Paths.get(fileName)).normalize().toAbsolutePath();
            
            if (!destinationFile.getParent().equals(this.rootLocation.toAbsolutePath())) {
                throw new SecurityException("Cannot store file outside current directory.");
            }

            // Uso de java.nio.file.Files.write con captura explicita de IOException
            Files.write(destinationFile, imageBytes);

            return fileName;
        } catch (IllegalArgumentException | SecurityException e) {
            throw e;
        } catch (IOException e) {
            logger.error("IO error saving signature file to disk: {}", e.getMessage(), e);
            throw new RuntimeException("Error saving signature to file system", e);
        } catch (Exception e) {
            logger.error("Unexpected error saving signature", e);
            throw new RuntimeException("Error saving signature", e);
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

    /**
     * Retrieves the file as a byte array for PDF generation or serving.
     */
    public byte[] loadSignature(String fileName) {
        try {
            Path file = rootLocation.resolve(fileName);
            if (Files.exists(file) && Files.isReadable(file)) {
                return Files.readAllBytes(file);
            } else {
                return new byte[0];
            }
        } catch (IOException e) {
            logger.error("Could not read signature file: {}", e.getMessage(), e);
            return new byte[0];
        }
    }
    
    /**
     * Deletes a signature file
     */
    public boolean deleteSignature(String fileName) {
        try {
            Path file = rootLocation.resolve(fileName);
            return Files.deleteIfExists(file);
        } catch (IOException e) {
            logger.error("Error deleting signature file: {}", e.getMessage(), e);
            return false;
        }
    }
}