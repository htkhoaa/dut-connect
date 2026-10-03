package vn.edu.dut.connect.shared.api;

import java.util.List;

import vn.edu.dut.connect.shared.application.PageResult;

public record PageResponse<T>(List<T> items, int page, int size, long totalElements, int totalPages,
                              boolean hasNext, boolean hasPrevious) {
    public static <T> PageResponse<T> from(PageResult<T> page) {
        return new PageResponse<>(page.items(), page.page(), page.size(), page.totalElements(),
                page.totalPages(), page.hasNext(), page.hasPrevious());
    }
}
