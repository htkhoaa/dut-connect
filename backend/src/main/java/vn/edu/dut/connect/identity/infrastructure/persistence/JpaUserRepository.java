package vn.edu.dut.connect.identity.infrastructure.persistence;

import java.util.*;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import vn.edu.dut.connect.identity.domain.User;

interface JpaUserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    Optional<User> findByStudentId(String studentId);

    boolean existsByStudentId(String studentId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> lockById(UUID id);

    @Query("""
        select u from User u
        where (:name is null or lower(u.fullName) like lower(concat('%', :name, '%')))
          and (:studentId is null or lower(u.studentId) like lower(concat('%', :studentId, '%')))
        order by u.createdAt desc, u.id asc
    """)
    org.springframework.data.domain.Page<User> searchUsers(String name, String studentId, org.springframework.data.domain.Pageable pageable);
}
