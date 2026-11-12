package com.odyssey.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class StorageService {

    public static final String FILE_URL_PREFIX = "/api/storage/files/";

    public static final int MAX_FILES_PER_REQUEST = 5;
    public static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024;

    private static final Map<String, String> ALLOWED_IMAGE_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/gif", ".gif",
            "image/webp", ".webp"
    );

    private final Path fileStorageLocation;

    public StorageService(@Value("${file.upload-dir:uploads}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir)
                .toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored", ex);
        }
    }

    public List<String> storeFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Please choose at least one image to upload.");
        }
        if (files.size() > MAX_FILES_PER_REQUEST) {
            throw new IllegalArgumentException(
                    "You can upload up to " + MAX_FILES_PER_REQUEST + " images at a time.");
        }

        List<String> fileUrls = new ArrayList<>();

        for (MultipartFile file : files) {
            validate(file);

            String extension = ALLOWED_IMAGE_TYPES.get(file.getContentType().toLowerCase(Locale.ROOT));
            String uniqueFileName = UUID.randomUUID() + extension;

            try {
                Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);
                Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

                fileUrls.add(FILE_URL_PREFIX + uniqueFileName);
            } catch (IOException ex) {
                throw new RuntimeException("Could not store uploaded file", ex);
            }
        }

        return fileUrls;
    }

    public Path getFileStorageLocation() {
        return fileStorageLocation;
    }

    public static boolean isAllowedImageUrl(String url) {
        return url != null && url.startsWith(FILE_URL_PREFIX);
    }

    private void validate(MultipartFile file) {
        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.isBlank()) {
            throw new IllegalArgumentException("Every uploaded file needs a name.");
        }

        String fileName = StringUtils.cleanPath(originalFileName);
        if (fileName.contains("..")) {
            throw new IllegalArgumentException("That file name is not allowed.");
        }

        if (file.isEmpty()) {
            throw new IllegalArgumentException("The uploaded image is empty.");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("Each image must be 5 MB or smaller.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.containsKey(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Only JPEG, PNG, GIF and WebP images can be uploaded.");
        }

        if (!hasValidSignature(file, contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("That file does not look like a valid image.");
        }
    }

    /**
     * Trusts the bytes, not the declared content type, so a renamed HTML or
     * executable file cannot be stored and later served from the API origin.
     */
    private boolean hasValidSignature(MultipartFile file, String contentType) {
        byte[] header = new byte[12];
        int read;
        try (InputStream inputStream = file.getInputStream()) {
            read = inputStream.read(header);
        } catch (IOException ex) {
            return false;
        }
        if (read < 6) {
            return false;
        }

        return switch (contentType) {
            case "image/jpeg" -> (header[0] & 0xFF) == 0xFF
                    && (header[1] & 0xFF) == 0xD8
                    && (header[2] & 0xFF) == 0xFF;
            case "image/png" -> (header[0] & 0xFF) == 0x89
                    && header[1] == 'P' && header[2] == 'N' && header[3] == 'G'
                    && (header[4] & 0xFF) == 0x0D && (header[5] & 0xFF) == 0x0A;
            case "image/gif" -> startsWith(header, read, "GIF87a") || startsWith(header, read, "GIF89a");
            case "image/webp" -> startsWith(header, read, "RIFF")
                    && read >= 12
                    && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
            default -> false;
        };
    }

    private boolean startsWith(byte[] header, int read, String expected) {
        if (read < expected.length()) {
            return false;
        }
        for (int i = 0; i < expected.length(); i++) {
            if (header[i] != (byte) expected.charAt(i)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Deletes stored image files once the surrounding database transaction has
     * committed, so a rollback never leaves rows pointing at missing files.
     */
    public void deleteFilesAfterCommit(Collection<String> fileUrls) {
        if (fileUrls == null || fileUrls.isEmpty()) {
            return;
        }
        List<String> urls = fileUrls.stream().filter(StringUtils::hasText).toList();
        if (urls.isEmpty()) {
            return;
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    urls.forEach(StorageService.this::deleteFile);
                }
            });
        } else {
            urls.forEach(this::deleteFile);
        }
    }

    private void deleteFile(String fileUrl) {
        String prefix = "/api/storage/files/";
        if (!fileUrl.startsWith(prefix)) {
            return;
        }
        String fileName = fileUrl.substring(prefix.length());
        if (fileName.isBlank() || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            return;
        }
        try {
            Files.deleteIfExists(this.fileStorageLocation.resolve(fileName).normalize());
        } catch (IOException ex) {
            // Missing or locked files should not fail an already committed change.
        }
    }
}
