package vn.edu.dut.connect.shared.application;
import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;
/** URL-safe names with readable Vietnamese transliteration. */
public final class ReadableSlug {
    private ReadableSlug() {}
    public static String base(String name) {
        String slug = Normalizer.normalize(name.toLowerCase(Locale.ROOT).replace('\u0111', 'd'), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        return slug.isEmpty() ? "campaign" : slug;
    }
    public static String suffix(String base) { return base + "-" + UUID.randomUUID().toString().substring(0, 8); }
}
