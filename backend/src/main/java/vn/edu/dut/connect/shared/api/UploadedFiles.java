package vn.edu.dut.connect.shared.api;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import javax.imageio.ImageIO;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

/** Small shared validation for gallery photos and receipts. Never trust the browser MIME type. */
public final class UploadedFiles {

    public record FileData(byte[] bytes, String contentType) {}

    private UploadedFiles() {}

    public static FileData image(MultipartFile file) throws IOException {
        byte[] bytes = read(file);
        try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw invalid();
            var reader = readers.next();
            try {
                reader.setInput(input);
                String format = reader.getFormatName().toLowerCase(java.util.Locale.ROOT);
                if (!java.util.Set.of("png", "jpeg", "jpg").contains(format)) throw invalid();
                int width = reader.getWidth(0),
                    height = reader.getHeight(0);
                if (
                    width > 4096 || height > 4096 || (long) width * height > 8_000_000
                ) throw invalid();
                var image = reader.read(0);
                var output = new ByteArrayOutputStream();
                String outputFormat = format.equals("png") ? "png" : "jpeg";
                ImageIO.write(image, outputFormat, output);
                if (output.size() > 5 * 1024 * 1024) throw invalid();
                return new FileData(output.toByteArray(), "image/" + outputFormat);
            } finally {
                reader.dispose();
            }
        } catch (javax.imageio.IIOException e) {
            throw invalid();
        }
    }

    public static FileData receipt(MultipartFile file) throws IOException {
        byte[] bytes = read(file);
        if (
            bytes.length >= 5 &&
            new String(bytes, 0, 5, java.nio.charset.StandardCharsets.US_ASCII).equals("%PDF-")
        ) {
            return new FileData(bytes, "application/pdf");
        }
        return image(file);
    }

    private static byte[] read(MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getSize() > 5 * 1024 * 1024) throw invalid();
        return file.getBytes();
    }

    private static ApplicationFailure invalid() {
        return new ApplicationFailure(
            400,
            "VALIDATION_ERROR",
            "Use a PNG/JPEG image up to 5 MB, 4096 pixels per side and 8 megapixels (or PDF for an expense receipt)"
        );
    }
}
