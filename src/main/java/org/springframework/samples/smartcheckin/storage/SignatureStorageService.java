package org.springframework.samples.smartcheckin.storage;

public interface SignatureStorageService {
    
    /**
     * Saves a base64 encoded signature.
     * @param base64Data the base64 string
     * @param pathContext the context path for the file (e.g., "formations/My_Course" or "checkins")
     * @return a unique reference (e.g. filename or item ID)
     */
    String saveSignature(String base64Data, String pathContext);

    /**
     * Retrieves the file as a byte array for PDF generation or serving.
     * @param reference The unique reference/ID of the signature.
     * @return The bytes of the signature image, or empty array if not found.
     */
    byte[] loadSignature(String reference);
    
    /**
     * Deletes a signature file.
     * @param reference The unique reference/ID of the signature.
     * @return true if successfully deleted, false otherwise.
     */
    boolean deleteSignature(String reference);
}
