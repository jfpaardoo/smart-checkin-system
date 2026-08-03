package org.springframework.samples.smartcheckin.storage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.FileOutputStream;
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
            // Remove the data URL prefix if present
            String base64Image = base64Data;
            if (base64Data.contains(",")) {
                base64Image = base64Data.split(",")[1];
            }

            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            String fileName = UUID.randomUUID().toString() + ".png";
            Path destinationFile = this.rootLocation.resolve(Paths.get(fileName)).normalize().toAbsolutePath();
            
            // Security check
            if (!destinationFile.getParent().equals(this.rootLocation.toAbsolutePath())) {
                throw new SecurityException("Cannot store file outside current directory.");
            }

            try (FileOutputStream fos = new FileOutputStream(destinationFile.toFile())) {
                fos.write(imageBytes);
            }

            return fileName;
        } catch (Exception e) {
            logger.error("Error saving signature to file system", e);
            throw new RuntimeException("Error saving signature", e);
        }
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
            logger.error("Could not read signature file", e);
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
            logger.error("Error deleting signature file", e);
            return false;
        }
    }
}
