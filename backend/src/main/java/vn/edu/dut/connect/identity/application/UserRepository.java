package vn.edu.dut.connect.identity.application;

import vn.edu.dut.connect.identity.domain.User;

import java.util.*;

import vn.edu.dut.connect.shared.application.PageResult;

public interface UserRepository {
    Optional<User> findUser(UUID id);

    Optional<User> lockUser(UUID id);

    Optional<User> findEmail(String email);

    boolean studentIdExists(String studentId);

    User saveUser(User user);

    PageResult<User> listUsers(Pagination page);
}
