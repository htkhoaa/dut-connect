package vn.edu.dut.connect.organization.domain;

import java.time.Instant;
import java.util.UUID;

public record OrganizationMembership(UUID userId, MemberRole memberRole, Instant joinedAt) {}
