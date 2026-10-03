package vn.edu.dut.connect.volunteer.application;
import vn.edu.dut.connect.volunteer.domain.*;
import vn.edu.dut.connect.shared.application.ApplicationFailure;
public record VolunteerQuery(int page,int size,RegistrationStatus status,VolunteerTrack track) {
    public VolunteerQuery {
        if(page<0 || size<1 || size>100) throw new ApplicationFailure(400,"VALIDATION_ERROR","Page must be nonnegative; size must be between 1 and 100");
    }
}
