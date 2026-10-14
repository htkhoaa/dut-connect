package vn.edu.dut.connect.identity.application;

import java.util.List;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

/** Registration catalog supplied by DUT Connect's owner. Suffixes retain the supplied units. */
public final class Faculties {
    private Faculties() {}
    public static final List<String> VALUES = List.of(
        "K. Cơ khí", "K. Công nghệ Thông tin", "K. Cơ khí Giao thông và Năng lượng",
        "K. Cơ khí Giao thông và Năng lượng (N)", "K. Điện", "K. Điện tử và Trí tuệ nhân tạo",
        "K. Hoá, Môi trường và Khoa học sự sống", "K. Cơ khí Giao thông và Năng lượng (SK)",
        "K. Xây dựng (X3)", "K. Xây dựng", "K. Xây dựng (X2)",
        "K. Hoá, Môi trường và Khoa học sự sống (MT)", "K. Quản lý dự án và Công nghiệp",
        "K. Kiến trúc", "K. Điện tử và Trí tuệ nhân tạo (122)", "K. Điện tử và Trí tuệ nhân tạo (123)");
    public static void require(String value) {
        if (value == null || !VALUES.contains(value.trim()))
            throw new ApplicationFailure(400, "VALIDATION_ERROR", "Select a faculty from the DUT catalog");
    }
}
