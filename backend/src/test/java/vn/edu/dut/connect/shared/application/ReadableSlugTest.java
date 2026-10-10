package vn.edu.dut.connect.shared.application;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class ReadableSlugTest {

    @ParameterizedTest(name = "Original: ''{0}'' -> Slug: ''{1}''")
    @CsvSource({
            "Mùa hè xanh Bách Khoa, mua-he-xanh-bach-khoa",
            "Đội Tình Nguyện DUT, doi-tinh-nguyen-dut",
            "Tiếp Sức Mùa Thi 2026!, tiep-suc-mua-thi-2026",
            "   Chiến Dịch    Môi Trường   , chien-dich-moi-truong",
            "---Special @#$ Characters---, special-characters"
    })
    @DisplayName("Transliterates Vietnamese accents and converts into URL-safe slugs")
    void transliteratesVietnameseToUrlSafeSlugs(String input, String expected) {
        String slug = ReadableSlug.base(input);
        assertThat(slug).isEqualTo(expected);
    }

    @Test
    @DisplayName("Falls back to 'campaign' when input has no alphanumeric characters")
    void fallsBackToDefaultOnEmptySlug() {
        assertThat(ReadableSlug.base("")).isEqualTo("campaign");
        assertThat(ReadableSlug.base("   ")).isEqualTo("campaign");
        assertThat(ReadableSlug.base("!@#$%^&*()")).isEqualTo("campaign");
    }

    @Test
    @DisplayName("Generates unique 8-character hex suffix")
    void appendsUniqueSuffix() {
        String base = "mua-he-xanh";
        String slug1 = ReadableSlug.suffix(base);
        String slug2 = ReadableSlug.suffix(base);

        assertThat(slug1).startsWith("mua-he-xanh-");
        assertThat(slug2).startsWith("mua-he-xanh-");
        assertThat(slug1).isNotEqualTo(slug2);
        assertThat(slug1).hasSize(base.length() + 1 + 8);
    }
}
