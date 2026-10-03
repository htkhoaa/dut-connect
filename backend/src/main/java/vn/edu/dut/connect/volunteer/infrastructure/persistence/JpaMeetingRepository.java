package vn.edu.dut.connect.volunteer.infrastructure.persistence;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.dut.connect.volunteer.domain.Meeting;

interface JpaMeetingRepository extends JpaRepository<Meeting, UUID> {
}
