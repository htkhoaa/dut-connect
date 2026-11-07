package vn.edu.dut.connect.identity.infrastructure.persistence;

import java.util.*;

import org.springframework.stereotype.Repository;
import org.springframework.data.domain.*;
import vn.edu.dut.connect.identity.domain.User;
import vn.edu.dut.connect.identity.application.UserRepository;
import vn.edu.dut.connect.identity.application.Pagination;
import vn.edu.dut.connect.shared.application.PageResult;

@Repository
public class UserPersistence implements UserRepository {
    private final JpaUserRepository users;

    public UserPersistence(JpaUserRepository users) {
        this.users = users;
    }

    public Optional<User> findUser(UUID id) {
        return users.findById(id);
    }

    public Optional<User> lockUser(UUID id) {
        return users.lockById(id);
    }

    public Optional<User> findEmail(String email) {
        return users.findByEmail(email);
    }

    public Optional<User> findStudentId(String studentId) {
        return users.findByStudentId(studentId);
    }

    public boolean studentIdExists(String id) {
        return users.existsByStudentId(id);
    }

    public User saveUser(User user) {
        return users.saveAndFlush(user);
    }

    public PageResult<User> listUsers(Pagination query) {
        return listUsers(query, null, null);
    }

    public PageResult<User> listUsers(Pagination query, String name, String studentId) {
        String cleanName = (name != null && !name.isBlank()) ? name.trim() : null;
        String cleanStudentId = (studentId != null && !studentId.isBlank()) ? studentId.trim() : null;

        Page<User> page;
        var pageable = PageRequest.of(query.page(), query.size(),
                Sort.by("createdAt").descending().and(Sort.by("id")));

        if (cleanName != null && cleanStudentId != null) {
            page = users.findByFullNameContainingIgnoreCaseAndStudentIdContainingIgnoreCase(cleanName, cleanStudentId, pageable);
        } else if (cleanName != null) {
            page = users.findByFullNameContainingIgnoreCase(cleanName, pageable);
        } else if (cleanStudentId != null) {
            page = users.findByStudentIdContainingIgnoreCase(cleanStudentId, pageable);
        } else {
            page = users.findAll(pageable);
        }
        return new PageResult<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(),
                page.getTotalPages(), page.hasNext(), page.hasPrevious());
    }
}
