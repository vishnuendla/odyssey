package com.odyssey.service;

import com.odyssey.entity.CommentAttachment;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StorageServiceTest {

    @TempDir
    Path uploadDir;

    @Test
    void storesGifAndClassifiesItForComments() {
        StorageService storage = new StorageService(uploadDir.toString());
        MockMultipartFile gif = new MockMultipartFile(
                "files", "party.gif", "image/gif", gifBytes());

        List<String> urls = storage.storeCommentMedia(List.of(gif));

        assertThat(urls).hasSize(1);
        assertThat(urls.get(0)).startsWith(StorageService.FILE_URL_PREFIX).endsWith(".gif");
        assertThat(StorageService.classifyCommentMedia(urls.get(0)))
                .isEqualTo(CommentAttachment.MediaType.GIF);
        assertThat(Files.exists(uploadDir.resolve(urls.get(0).substring(
                StorageService.FILE_URL_PREFIX.length())))).isTrue();
    }

    @Test
    void classifiesStoredExtensionsWithoutTrustingTheClient() {
        assertThat(StorageService.classifyCommentMedia("/api/storage/files/a.mp4"))
                .isEqualTo(CommentAttachment.MediaType.VIDEO);
        assertThat(StorageService.classifyCommentMedia("/api/storage/files/a.webp"))
                .isEqualTo(CommentAttachment.MediaType.IMAGE);
        assertThat(StorageService.classifyCommentMedia("/api/storage/files/a.svg")).isNull();
        assertThat(StorageService.classifyCommentMedia("https://example.com/a.gif")).isNull();
        assertThat(StorageService.classifyCommentMedia(null)).isNull();
    }

    @Test
    void rejectsFilesWhoseBytesDoNotMatchTheirDeclaredVideoType() {
        StorageService storage = new StorageService(uploadDir.toString());
        MockMultipartFile fakeVideo = new MockMultipartFile(
                "files", "clip.mp4", "video/mp4", new byte[32]);

        assertThatThrownBy(() -> storage.storeCommentMedia(List.of(fakeVideo)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("valid image or video");
    }

    @Test
    void rejectsMoreThanOneVideoPerComment() {
        StorageService storage = new StorageService(uploadDir.toString());
        MockMultipartFile first = new MockMultipartFile("files", "a.mp4", "video/mp4", mp4Bytes());
        MockMultipartFile second = new MockMultipartFile("files", "b.mp4", "video/mp4", mp4Bytes());

        assertThatThrownBy(() -> storage.storeCommentMedia(List.of(first, second)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("one video");
    }

    @Test
    void journalsStillOnlyAcceptImages() {
        StorageService storage = new StorageService(uploadDir.toString());
        MockMultipartFile video = new MockMultipartFile("images", "clip.mp4", "video/mp4", mp4Bytes());

        assertThatThrownBy(() -> storage.storeFiles(List.of(video)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Only JPEG");
    }

    private byte[] gifBytes() {
        byte[] bytes = new byte[24];
        byte[] header = "GIF89a".getBytes(StandardCharsets.US_ASCII);
        System.arraycopy(header, 0, bytes, 0, header.length);
        return bytes;
    }

    private byte[] mp4Bytes() {
        byte[] bytes = new byte[32];
        byte[] brand = "ftyp".getBytes(StandardCharsets.US_ASCII);
        System.arraycopy(brand, 0, bytes, 4, brand.length);
        return bytes;
    }
}
