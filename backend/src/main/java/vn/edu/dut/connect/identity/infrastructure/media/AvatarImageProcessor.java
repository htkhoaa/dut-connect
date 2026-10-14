package vn.edu.dut.connect.identity.infrastructure.media;
import java.awt.Color;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.*;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Component;
import vn.edu.dut.connect.identity.application.AvatarProcessor;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

@Component
public class AvatarImageProcessor implements AvatarProcessor {
    public byte[] jpeg(byte[] upload) {
        if (upload == null || upload.length == 0 || upload.length > 1048576) throw invalid();
        try (var input = ImageIO.createImageInputStream(new ByteArrayInputStream(upload))) {
            var readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw invalid();
            var reader = readers.next();
            try {
                reader.setInput(input);
                String format = reader.getFormatName();
                if (!format.equalsIgnoreCase("JPEG") && !format.equalsIgnoreCase("PNG")) throw invalid();
                int width = reader.getWidth(0), height = reader.getHeight(0);
                if (width < 1 || height < 1 || width > 4096 || height > 4096 || (long) width * height > 8000000) throw invalid();
                BufferedImage original = reader.read(0);
                BufferedImage result = new BufferedImage(256, 256, BufferedImage.TYPE_INT_RGB);
                var graphics = result.createGraphics();
                try {
                    graphics.setColor(Color.WHITE); graphics.fillRect(0, 0, 256, 256);
                    graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                    int side = Math.min(width, height), x = (width - side) / 2, y = (height - side) / 2;
                    graphics.drawImage(original, 0, 0, 256, 256, x, y, x + side, y + side, null);
                } finally {graphics.dispose();}
                var output = new ByteArrayOutputStream();
                if (!ImageIO.write(result, "JPEG", output) || output.size() > 262144) throw invalid();
                return output.toByteArray();
            } finally {reader.dispose();}
        } catch (IOException | IllegalArgumentException exception) {throw invalid();}
    }
    private static ApplicationFailure invalid() {
        return new ApplicationFailure(400, "VALIDATION_ERROR", "Upload a PNG or JPEG up to 1 MB and 8 megapixels");
    }
}
