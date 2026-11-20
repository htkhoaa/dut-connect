package vn.edu.dut.connect.shared.api;

import java.util.UUID;
import org.springframework.security.core.Authentication;

/** Converts the authenticated JWT subject into the application's user ID. */
public final class CurrentActor {

    private CurrentActor() {}

    public static UUID id(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
