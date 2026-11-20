package vn.edu.dut.connect.volunteer.application;

import vn.edu.dut.connect.shared.application.PageValidation;
import vn.edu.dut.connect.volunteer.domain.*;

public record VolunteerQuery(int page, int size, RegistrationStatus status, VolunteerTrack track) {
    public VolunteerQuery {
        PageValidation.requireValid(page, size);
    }
}
