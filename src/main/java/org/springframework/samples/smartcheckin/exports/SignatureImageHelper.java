package org.springframework.samples.smartcheckin.exports;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Base64;

import javax.imageio.ImageIO;

import org.springframework.samples.smartcheckin.storage.SignatureStorageService;
import org.springframework.stereotype.Component;

@Component
public class SignatureImageHelper {

    private final SignatureStorageService signatureStorageService;

    public SignatureImageHelper(SignatureStorageService signatureStorageService) {
        this.signatureStorageService = signatureStorageService;
    }

    public byte[] extractSignaturePng(String signature) {
        if (signature == null || signature.trim().isEmpty()) {
            return new byte[0];
        }
        String sig = signature.trim();
        if (sig.startsWith("data:image")) {
            String[] parts = sig.split(",", 2);
            if (parts.length < 2) {
                return new byte[0];
            }
            try {
                return Base64.getDecoder().decode(parts[1]);
            } catch (IllegalArgumentException e) {
                return Base64.getUrlDecoder().decode(parts[1]);
            }
        }
        try {
            if (signatureStorageService != null) {
                byte[] loaded = signatureStorageService.loadSignature(sig);
                if (loaded != null && loaded.length > 0) {
                    return loaded;
                }
            }
            return Base64.getDecoder().decode(sig);
        } catch (Exception e) {
            return new byte[0];
        }
    }

    public byte[] trimSignatureImage(byte[] imageBytes) {
        if (imageBytes == null || imageBytes.length == 0) {
            return imageBytes;
        }
        try {
            ByteArrayInputStream bais = new ByteArrayInputStream(imageBytes);
            BufferedImage img = ImageIO.read(bais);
            if (img == null) {
                return imageBytes;
            }
            int[] bounds = calculateSignatureBounds(img);
            if (bounds.length == 0) {
                return imageBytes;
            }

            int minX = bounds[0];
            int minY = bounds[1];
            int maxX = bounds[2];
            int maxY = bounds[3];

            int cropX = Math.max(0, minX - 2);
            int cropY = Math.max(0, minY - 2);
            int cropW = Math.min(img.getWidth() - cropX, (maxX - minX + 1) + 4);
            int cropH = Math.min(img.getHeight() - cropY, (maxY - minY + 1) + 4);

            BufferedImage trimmed = img.getSubimage(cropX, cropY, cropW, cropH);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(trimmed, "png", baos);
            return baos.toByteArray();
        } catch (Exception e) {
            return imageBytes;
        }
    }

    private static int[] calculateSignatureBounds(BufferedImage img) {
        int width = img.getWidth();
        int height = img.getHeight();
        int[] bounds = new int[]{width, height, -1, -1};

        for (int y = 0; y < height; y++) {
            updateRowBounds(img, y, width, bounds);
        }
        if (bounds[2] < bounds[0] || bounds[3] < bounds[1]) {
            return new int[0];
        }
        return bounds;
    }

    private static void updateRowBounds(BufferedImage img, int y, int width, int[] bounds) {
        for (int x = 0; x < width; x++) {
            if (isDrawnPixel(img.getRGB(x, y))) {
                bounds[0] = Math.min(bounds[0], x);
                bounds[1] = Math.min(bounds[1], y);
                bounds[2] = Math.max(bounds[2], x);
                bounds[3] = Math.max(bounds[3], y);
            }
        }
    }

    private static boolean isDrawnPixel(int argb) {
        int alpha = (argb >> 24) & 0xff;
        int r = (argb >> 16) & 0xff;
        int g = (argb >> 8) & 0xff;
        int b = argb & 0xff;
        return (alpha > 20) && !(r > 240 && g > 240 && b > 240);
    }
}
