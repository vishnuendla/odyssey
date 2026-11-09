package com.odyssey.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
public class StorageService {

    private static final int MAX_FILES_PER_REQUEST = 10;
    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;

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

                fileUrls.add("/api/storage/files/" + uniqueFileName);
            } catch (IOException ex) {
                throw new RuntimeException("Could not store uploaded file", ex);
            }
        }

        return fileUrls;
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
            throw new IllegalArgumentException("Each image must be 10 MB or smaller.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.containsKey(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Only JPEG, PNG, GIF and WebP images can be uploaded.");
        }
    }
}
