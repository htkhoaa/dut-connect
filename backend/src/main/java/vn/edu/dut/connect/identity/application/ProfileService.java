package vn.edu.dut.connect.identity.application;

import java.util.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.dut.connect.identity.domain.*;
import vn.edu.dut.connect.shared.application.PageResult;
import vn.edu.dut.connect.shared.application.ApplicationFailure;

import static vn.edu.dut.connect.identity.application.IdentityContracts.*;

@Service
public class ProfileService {
    private final UserRepository users;
    private final ProfileRepository profiles;
    private final SkillRepository skills;

    public ProfileService(UserRepository users, ProfileRepository profiles, SkillRepository skills) {
        this.users = users;
        this.profiles = profiles;
        this.skills = skills;
    }

    @Transactional(readOnly = true)
    public ProfileResponse get(UUID id) {
        return response(user(id), profile(id));
    }

    @Transactional
    public ProfileResponse update(UUID id, ProfileRequest request) {
        User user = users.lockUser(id).orElseThrow(() -> ApplicationFailure.missing("User not found"));
        IdentityAccess.requireActive(user);
        StudentProfile profile = profile(id);
        RegistrationRules.version(user.version(), request.userVersion());
        RegistrationRules.version(profile.version(), request.version());
        user.rename(request.fullName().trim());
        profile.update(request.faculty().trim(), trim(request.bio()), request.preferredTrack(), trim(request.experience()));
        users.saveUser(user);
        profiles.saveProfile(profile);
        return response(user, profile);
    }

    @Transactional
    public ProfileResponse updateSkills(UUID id, SkillsRequest request) {
        User user = users.lockUser(id).orElseThrow(() -> ApplicationFailure.missing("User not found"));
        IdentityAccess.requireActive(user);
        StudentProfile profile = profiles.lockProfile(id).orElseThrow(() -> ApplicationFailure.missing("Student profile not found"));
        RegistrationRules.version(profile.version(), request.version());
        Set<UUID> ids = new HashSet<>(request.skillIds());
        if (ids.size() != request.skillIds().size() || !skills.allActive(ids))
            throw new ApplicationFailure(400, "VALIDATION_ERROR", "Select distinct, active skills");
        skills.replaceSkills(id, ids);
        profile.touch();
        profiles.saveProfile(profile);
        return response(user, profile);
    }

    @Transactional(readOnly = true)
    public PageResult<SkillResponse> catalog(int page, int size) {
        return skills.activeSkills(new Pagination(page, size)).map(SkillResponse::from);
    }

    private User user(UUID id) {
        User user = users.findUser(id).orElseThrow(() -> ApplicationFailure.missing("User not found"));
        IdentityAccess.requireActive(user);
        return user;
    }

    private StudentProfile profile(UUID id) {
        return profiles.findProfile(id).orElseThrow(() -> ApplicationFailure.missing("Student profile not found"));
    }

    private ProfileResponse response(User user, StudentProfile profile) {
        return new ProfileResponse(UserSummary.from(user), profile.faculty(), profile.bio(), profile.preferredTrack(), profile.experience(),
                profile.version(), skills.userSkills(user.id()).stream().map(SkillResponse::from).toList());
    }

    private static String trim(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
