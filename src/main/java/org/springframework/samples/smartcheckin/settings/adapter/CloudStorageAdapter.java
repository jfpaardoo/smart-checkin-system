package org.springframework.samples.smartcheckin.settings.adapter;

import org.springframework.web.multipart.MultipartFile;

public interface CloudStorageAdapter {

    String uploadFile(MultipartFile file, String folderName) throws Exception;

    String uploadBackup(byte[] data, String fileName) throws Exception;

    String uploadSignature(byte[] data, String fileName, String pathContext) throws Exception;

    byte[] downloadFile(String itemId) throws Exception;

    void deleteFile(String fileIdOrUrl) throws Exception;
}
