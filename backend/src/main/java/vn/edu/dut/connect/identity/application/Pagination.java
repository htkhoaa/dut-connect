package vn.edu.dut.connect.identity.application;

import vn.edu.dut.connect.shared.application.PageValidation;

public record Pagination(int page, int size) {
    public Pagination {
        PageValidation.requireValid(page, size);
    }
}
