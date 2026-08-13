package org.springframework.samples.smartcheckin.settings.adapter;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface CloudStorageAdapter {

    String uploadFile(MultipartFile file, String folderName) throws IOException;

    String uploadBackup(byte[] data, String fileName) throws IOException;

    String uploadSignature(byte[] data, String fileName, String pathContext) throws IOException;

    byte[] downloadFile(String itemId) throws IOException;

    void deleteFile(String fileIdOrUrl) throws IOException;
}
