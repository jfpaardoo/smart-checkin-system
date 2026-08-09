package org.springframework.samples.smartcheckin.storage;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/signatures")
public class SignatureRestController {

    private final SignatureStorageService signatureStorageService;

    @Autowired
    public SignatureRestController(SignatureStorageService signatureStorageService) {
        this.signatureStorageService = signatureStorageService;
    }

    @GetMapping("/{fileName}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> getSignature(@PathVariable String fileName) {
        // Sanitize the filename to prevent directory traversal attacks
        String safeFileName = fileName.replaceAll("[^a-zA-Z0-9._!\\-]", "");

        byte[] image = signatureStorageService.loadSignature(safeFileName);

        if (image == null || image.length == 0) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setContentLength(image.length);

        return new ResponseEntity<>(image, headers, HttpStatus.OK);
    }
}
