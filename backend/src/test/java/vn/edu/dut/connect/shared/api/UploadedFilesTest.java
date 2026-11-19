package vn.edu.dut.connect.shared.api;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
import static org.junit.jupiter.api.Assertions.*;

class UploadedFilesTest {
    @Test void rejectsSvgEvenWhenBrowserCallsItJpeg() {
        var file = new MockMultipartFile("file", "photo.jpg", "image/jpeg", "<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>".getBytes());
        assertThrows(ApplicationFailure.class, () -> UploadedFiles.image(file));
    }

    @Test void determinesTypeFromImageBytes() throws Exception {
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), "png", output);
        var image = UploadedFiles.image(new MockMultipartFile("file", "wrong.jpg", "text/html", output.toByteArray()));
        assertEquals("image/png", image.contentType());
        assertNotNull(ImageIO.read(new java.io.ByteArrayInputStream(image.bytes())));
    }

    @Test void rejectsOversizedDimensionsBeforeDecodingPixels() throws Exception {
        var output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(4097, 1, BufferedImage.TYPE_INT_RGB), "png", output);
        var file = new MockMultipartFile("file", "large.png", "image/png", output.toByteArray());
        assertThrows(ApplicationFailure.class, () -> UploadedFiles.image(file));
    }

    @Test void acceptsPdfReceiptButNotAsGalleryImage() throws Exception {
        var file = new MockMultipartFile("file", "receipt.pdf", "application/pdf", "%PDF-1.4\nexample".getBytes());
        assertEquals("application/pdf", UploadedFiles.receipt(file).contentType());
        assertThrows(ApplicationFailure.class, () -> UploadedFiles.image(file));
    }
}
