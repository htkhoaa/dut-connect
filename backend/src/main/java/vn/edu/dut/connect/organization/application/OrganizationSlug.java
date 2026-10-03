package vn.edu.dut.connect.organization.application;
import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;
public final class OrganizationSlug {
    private OrganizationSlug() {
    }
    public static String base(String name) {
        String slug=Normalizer.normalize(name.toLowerCase(Locale.ROOT).replace('\u0111', 'd'), Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "").replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        return slug.isEmpty()?"organization":slug;
    }
    public static String suffixed(String base) {
        return base+"-"+UUID.randomUUID().toString().substring(0, 8);
    }
}
