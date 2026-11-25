package com.odyssey.controller;

import com.odyssey.service.StorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

class StorageControllerTest {

    @TempDir
    Path uploadDir;

    @Test
    void servesVideoByteRangesWithCorrectHeaders() throws Exception {
        byte[] content = new byte[256];
        for (int i = 0; i < content.length; i++) {
            content[i] = (byte) i;
        }
        Files.write(uploadDir.resolve("clip.mp4"), content);
        StorageController controller = new StorageController(new StorageService(uploadDir.toString()));

        ResponseEntity<?> response = controller.getFile("clip.mp4", "bytes=10-19");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.PARTIAL_CONTENT);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_RANGE))
                .isEqualTo("bytes 10-19/256");
        assertThat(response.getHeaders().getFirst(HttpHeaders.ACCEPT_RANGES)).isEqualTo("bytes");
        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("video/mp4");
        assertThat(response.getBody()).isInstanceOf(byte[].class);
        assertThat((byte[]) response.getBody())
                .containsExactly(Arrays.copyOfRange(content, 10, 20));
    }

    @Test
    void fallsBackToTheWholeFileForUnsatisfiableRanges() throws Exception {
        Files.write(uploadDir.resolve("clip.mp4"), new byte[64]);
        StorageController controller = new StorageController(new StorageService(uploadDir.toString()));

        ResponseEntity<?> response = controller.getFile("clip.mp4", "bytes=500-600");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_RANGE)).isNull();
    }

    @Test
    void servesMultipartRangeRequestsAsOneWholeBody() throws Exception {
        Files.write(uploadDir.resolve("clip.mp4"), new byte[64]);
        StorageController controller = new StorageController(new StorageService(uploadDir.toString()));

        ResponseEntity<?> response = controller.getFile("clip.mp4", "bytes=0-9,20-29");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        // Byte bodies never trigger Spring's own Resource range conversion.
        assertThat(response.getBody()).isInstanceOf(byte[].class);
        assertThat((byte[]) response.getBody()).hasSize(64);
    }

    @Test
    void refusesPathsThatEscapeTheUploadDirectory() {
        StorageController controller = new StorageController(new StorageService(uploadDir.toString()));

        assertThat(controller.getFile("../secret.txt", null).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }
}
