package com.odyssey.controller;

import com.odyssey.service.StorageService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/storage")
public class StorageController {

    private static final CacheControl FILE_CACHE =
            CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable();

    private final StorageService storageService;

    public StorageController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<List<String>> uploadFiles(@RequestParam("images") List<MultipartFile> files) {
        List<String> fileUrls = storageService.storeFiles(files);
        return ResponseEntity.ok(fileUrls);
    }

    @PostMapping("/upload/comment-media")
    public ResponseEntity<List<String>> uploadCommentMedia(@RequestParam("files") List<MultipartFile> files) {
        return ResponseEntity.ok(storageService.storeCommentMedia(files));
    }

    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<?> getFile(
            @PathVariable String fileName,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader) {
        Path fileStorageLocation = storageService.getFileStorageLocation();
        try {
            if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
                return ResponseEntity.notFound().build();
            }
            Path filePath = fileStorageLocation.resolve(fileName).normalize();
            if (!filePath.startsWith(fileStorageLocation)) {
                return ResponseEntity.notFound().build();
            }
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = determineContentType(fileName);

            if (rangeHeader != null && !rangeHeader.isBlank()) {
                ResponseEntity<?> partial = partialFile(resource, contentType, rangeHeader);
                if (partial != null) {
                    return partial;
                }
                // An unsupported range (for example a multipart range) falls
                // back to the whole file. Returning bytes, not a Resource, stops
                // Spring from attempting its own range conversion.
                return wholeBody(resource, contentType);
            }

            return new ResponseEntity<>(resource, fileHeaders(contentType), HttpStatus.OK);
        } catch (MalformedURLException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    private ResponseEntity<?> wholeBody(Resource resource, String contentType) {
        try {
            return new ResponseEntity<>(
                    resource.getInputStream().readAllBytes(),
                    fileHeaders(contentType),
                    HttpStatus.OK);
        } catch (IOException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private HttpHeaders fileHeaders(String contentType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.set(HttpHeaders.CACHE_CONTROL, FILE_CACHE.getHeaderValue());
        // Uploaded files are served from the same origin as the API.
        // nosniff stops a crafted file from being treated as HTML/JS.
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("Content-Security-Policy", "default-src 'none'; img-src 'self'; media-src 'self'");
        headers.set(HttpHeaders.ACCEPT_RANGES, "bytes");
        return headers;
    }

    /**
     * Firefox asks for byte ranges when it plays a clip. Serving 206 responses
     * keeps short comment videos from downloading repeatedly while looping.
     */
    private ResponseEntity<?> partialFile(Resource resource, String contentType, String rangeHeader) {
        try {
            List<HttpRange> ranges = HttpRange.parseRanges(rangeHeader);
            if (ranges.size() != 1) {
                // Multi-range requests are rare and would need a multipart
                // body; a plain 200 keeps every browser playing instead.
                return null;
            }
            long length = resource.contentLength();
            if (length <= 0) {
                return null;
            }

            HttpRange range = ranges.get(0);
            long start = range.getRangeStart(length);
            long end = range.getRangeEnd(length);
            if (start < 0 || end < start || end >= length) {
                return null;
            }

            byte[] slice = readRange(resource, start, end - start + 1);
            if (slice == null) {
                return null;
            }
            long last = start + slice.length - 1;

            HttpHeaders headers = fileHeaders(contentType);
            headers.set(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + last + "/" + length);
            return new ResponseEntity<>(slice, headers, HttpStatus.PARTIAL_CONTENT);
        } catch (IllegalArgumentException | IOException ex) {
            // Unsatisfiable or malformed range: fall back to the full file.
            return null;
        }
    }

    /**
     * Comment clips are capped at 15 MB, so copying the requested window into
     * memory is simpler and more predictable than streaming a region.
     */
    private byte[] readRange(Resource resource, long start, long count) {
        if (count <= 0 || count > Integer.MAX_VALUE) {
            return null;
        }
        byte[] buffer = new byte[(int) count];
        try (InputStream input = resource.getInputStream()) {
            long toSkip = start;
            while (toSkip > 0) {
                long skipped = input.skip(toSkip);
                if (skipped <= 0) {
                    if (input.read() < 0) {
                        return null;
                    }
                    skipped = 1;
                }
                toSkip -= skipped;
            }

            int read = 0;
            while (read < buffer.length) {
                int chunk = input.read(buffer, read, buffer.length - read);
                if (chunk < 0) {
                    break;
                }
                read += chunk;
            }
            if (read <= 0) {
                return null;
            }
            return read == buffer.length ? buffer : Arrays.copyOf(buffer, read);
        } catch (IOException ex) {
            return null;
        }
    }

    private String determineContentType(String fileName) {
        String lower = fileName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lower.endsWith(".png")) {
            return "image/png";
        } else if (lower.endsWith(".gif")) {
            return "image/gif";
        } else if (lower.endsWith(".webp")) {
            return "image/webp";
        } else if (lower.endsWith(".mp4")) {
            return "video/mp4";
        } else if (lower.endsWith(".webm")) {
            return "video/webm";
        } else {
            return "application/octet-stream";
        }
    }
}
