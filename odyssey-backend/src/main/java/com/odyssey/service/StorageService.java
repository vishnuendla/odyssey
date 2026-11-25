package com.odyssey.service;

import com.odyssey.entity.CommentAttachment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
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

    public static final int MAX_COMMENT_MEDIA_FILES = 3;
    public static final long MAX_VIDEO_SIZE_BYTES = 15L * 1024 * 1024;
    public static final long MAX_COMMENT_MEDIA_TOTAL_BYTES = 18L * 1024 * 1024;

    private static final Map<String, String> ALLOWED_IMAGE_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/gif", ".gif",
            "image/webp", ".webp"
    );

    private static final Map<String, String> ALLOWED_VIDEO_TYPES = Map.of(
            "video/mp4", ".mp4",
            "video/webm", ".webm"
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

        return store(files, false);
    }

    /**
     * Comment media is intentionally tighter than journal galleries: a handful
     * of small images or one short clip, so a thread never turns into a file
     * host and every attachment stays cheap to load on a phone.
     */
    public List<String> storeCommentMedia(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Choose a photo, GIF or short video to attach.");
        }
        if (files.size() > MAX_COMMENT_MEDIA_FILES) {
            throw new IllegalArgumentException(
                    "You can attach up to " + MAX_COMMENT_MEDIA_FILES + " media files at a time.");
        }

        long total = files.stream().mapToLong(MultipartFile::getSize).sum();
        if (total > MAX_COMMENT_MEDIA_TOTAL_BYTES) {
            throw new IllegalArgumentException("The selected media is larger than 18 MB in total.");
        }
        long videos = files.stream().filter(this::isVideo).count();
        if (videos > 1) {
            throw new IllegalArgumentException("You can attach one video per comment.");
        }

        return store(files, true);
    }

    public Path getFileStorageLocation() {
        return fileStorageLocation;
    }

    public static boolean isAllowedImageUrl(String url) {
        return url != null && url.startsWith(FILE_URL_PREFIX);
    }

    /**
     * The client only sends URLs. The server re-derives the media type from the
     * stored extension, which storage validation has already tied to real bytes.
     */
    public static CommentAttachment.MediaType classifyCommentMedia(String url) {
        if (url == null || !url.startsWith(FILE_URL_PREFIX)) {
            return null;
        }
        String fileName = url.substring(FILE_URL_PREFIX.length());
        if (fileName.isBlank()
                || fileName.contains("..")
                || fileName.contains("/")
                || fileName.contains("\\")
                || fileName.contains("?")
                || fileName.contains("#")) {
            return null;
        }

        String lower = fileName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".gif")) {
            return CommentAttachment.MediaType.GIF;
        }
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")
                || lower.endsWith(".png") || lower.endsWith(".webp")) {
            return CommentAttachment.MediaType.IMAGE;
        }
        if (lower.endsWith(".mp4") || lower.endsWith(".webm")) {
            return CommentAttachment.MediaType.VIDEO;
        }
        return null;
    }

    /**
     * Profile avatars may also point at an ordinary http(s) image, but never at
     * {@code data:}, {@code javascript:} or other schemes.
     */
    public static boolean isAllowedAvatarUrl(String url) {
        if (url == null) {
            return true;
        }
        if (isAllowedImageUrl(url)) {
            return true;
        }
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme();
            return ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))
                    && uri.getHost() != null
                    && !uri.getHost().isBlank();
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private List<String> store(List<MultipartFile> files, boolean allowVideo) {
        // Validate every file before writing any bytes, so one bad pick cannot
        // leave earlier files orphaned on disk.
        List<String> extensions = new ArrayList<>(files.size());
        for (MultipartFile file : files) {
            extensions.add(validate(file, allowVideo));
        }

        List<String> fileUrls = new ArrayList<>();
        List<Path> written = new ArrayList<>();

        try {
            for (int i = 0; i < files.size(); i++) {
                String uniqueFileName = UUID.randomUUID() + extensions.get(i);
                Path targetLocation = this.fileStorageLocation.resolve(uniqueFileName);
                Files.copy(files.get(i).getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
                written.add(targetLocation);
                fileUrls.add(FILE_URL_PREFIX + uniqueFileName);
            }
        } catch (IOException ex) {
            for (Path path : written) {
                try {
                    Files.deleteIfExists(path);
                } catch (IOException ignored) {
                    // Best-effort cleanup before reporting the write failure.
                }
            }
            throw new RuntimeException("Could not store uploaded file", ex);
        }

        return fileUrls;
    }

    private boolean isVideo(MultipartFile file) {
        String contentType = file.getContentType();
        return contentType != null
                && ALLOWED_VIDEO_TYPES.containsKey(contentType.toLowerCase(Locale.ROOT));
    }

    private String validate(MultipartFile file, boolean allowVideo) {
        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.isBlank()) {
            throw new IllegalArgumentException("Every uploaded file needs a name.");
        }

        String fileName = StringUtils.cleanPath(originalFileName);
        if (fileName.contains("..")) {
            throw new IllegalArgumentException("That file name is not allowed.");
        }

        if (file.isEmpty()) {
            throw new IllegalArgumentException("The uploaded file is empty.");
        }

        String contentType = file.getContentType();
        String normalizedType = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        String extension = ALLOWED_IMAGE_TYPES.get(normalizedType);
        boolean video = false;
        if (extension == null && allowVideo) {
            extension = ALLOWED_VIDEO_TYPES.get(normalizedType);
            video = extension != null;
        }
        if (extension == null) {
            throw new IllegalArgumentException(allowVideo
                    ? "Only JPEG, PNG, GIF, WebP, MP4 and WebM files can be attached."
                    : "Only JPEG, PNG, GIF and WebP images can be uploaded.");
        }

        long maxSize = video ? MAX_VIDEO_SIZE_BYTES : MAX_FILE_SIZE_BYTES;
        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException(video
                    ? "Each video must be 15 MB or smaller."
                    : "Each image must be 5 MB or smaller.");
        }

        if (!hasValidSignature(file, normalizedType)) {
            throw new IllegalArgumentException("That file does not look like a valid image or video.");
        }

        return extension;
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
        if (read < 12) {
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
            case "video/mp4" -> header[4] == 'f' && header[5] == 't' && header[6] == 'y' && header[7] == 'p';
            case "video/webm" -> (header[0] & 0xFF) == 0x1A
                    && (header[1] & 0xFF) == 0x45
                    && (header[2] & 0xFF) == 0xDF
                    && (header[3] & 0xFF) == 0xA3;
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
     * Deletes stored files once the surrounding database transaction has
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
