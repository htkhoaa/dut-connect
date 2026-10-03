package vn.edu.dut.connect.shared.application;

import java.util.List;
import java.util.function.Function;

public record PageResult<T>(List<T> items, int page, int size, long totalElements, int totalPages,
                            boolean hasNext, boolean hasPrevious) {
    public <R> PageResult<R> map(Function<T, R> mapper) {
        return new PageResult<>(items.stream().map(mapper).toList(), page, size, totalElements,
                totalPages, hasNext, hasPrevious);
    }
}
