package vn.edu.dut.connect.volunteer.infrastructure.persistence;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.dut.connect.volunteer.domain.AttendanceSession;

interface JpaSessionRepository extends JpaRepository<AttendanceSession, UUID> {
}
