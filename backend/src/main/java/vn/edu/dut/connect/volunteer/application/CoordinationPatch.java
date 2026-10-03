package vn.edu.dut.connect.volunteer.application;

import java.util.*;

import static vn.edu.dut.connect.volunteer.domain.CoordinationValues.*;

final class CoordinationPatch {
    private CoordinationPatch() {
    }

    static String text(String supplied, String existing, String field, Set<String> clear) {
        if (clear != null && clear.contains(field)) {
            if (supplied != null) invalid(field, "Cannot set and clear the same field");
            return null;
        }
        return supplied == null ? existing : supplied;
    }

    static void clear(Set<String> fields, Set<String> allowed) {
        if (fields != null && (fields.stream().anyMatch(Objects::isNull) || !allowed.containsAll(fields)))
            invalid("clearFields", "Only optional fields may be cleared");
    }
}
