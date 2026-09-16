package com.sit.portal.controller;

import com.sit.portal.entity.*;
import com.sit.portal.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private StudentAcademicDataRepository studentAcademicDataRepository;

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUserProfile(
            @RequestParam(required = false) String email,
            Authentication authentication
    ) {
        String lookupEmail = (authentication != null && authentication.getName() != null && !authentication.getName().equals("anonymousUser"))
                ? authentication.getName().trim().toLowerCase()
                : (email != null ? email.trim().toLowerCase() : null);

        if (lookupEmail == null || lookupEmail.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "User is not authenticated.");
            return ResponseEntity.status(401).body(err);
        }

        Optional<User> userOpt = userRepository.findByEmail(lookupEmail);
        User user;
        if (userOpt.isEmpty()) {
            user = User.builder()
                    .email(lookupEmail)
                    .name(lookupEmail.split("@")[0])
                    .role(lookupEmail.endsWith("@sitcoe.org.in") ? "student" : "faculty")
                    .department("CSE")
                    .password(passwordEncoder.encode("DefaultPass123!"))
                    .build();
            user = userRepository.save(user);
        } else {
            user = userOpt.get();
        }

        Map<String, Object> profileMap = buildEnrichedProfile(user, lookupEmail);
        return ResponseEntity.ok(profileMap);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(
            @RequestParam(required = false) String email,
            Authentication authentication,
            @RequestBody Map<String, Object> updates
    ) {
        String lookupEmail = (authentication != null && authentication.getName() != null && !authentication.getName().equals("anonymousUser"))
                ? authentication.getName().trim().toLowerCase()
                : (updates.containsKey("email") && updates.get("email") != null
                    ? updates.get("email").toString().trim().toLowerCase()
                    : (email != null ? email.trim().toLowerCase() : null));

        if (lookupEmail == null || lookupEmail.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "User is not authenticated.");
            return ResponseEntity.status(401).body(err);
        }

        Optional<User> userOpt = userRepository.findByEmail(lookupEmail);
        User user = userOpt.orElseGet(() -> {
            String roleStr = updates.containsKey("role") && updates.get("role") != null
                    ? updates.get("role").toString().trim()
                    : (lookupEmail.endsWith("@sitcoe.org.in") ? "student" : "faculty");
            User newUser = User.builder()
                    .email(lookupEmail)
                    .name(updates.containsKey("name") && updates.get("name") != null ? updates.get("name").toString().trim() : lookupEmail.split("@")[0])
                    .role(roleStr)
                    .department(updates.containsKey("department") && updates.get("department") != null ? updates.get("department").toString().trim() : "CSE")
                    .password(passwordEncoder.encode("DefaultPass123!"))
                    .build();
            return userRepository.save(newUser);
        });

        // 1. Update Core User Entity
        if (updates.containsKey("name") && updates.get("name") != null) {
            user.setName(updates.get("name").toString().trim());
        }
        if (updates.containsKey("phone")) {
            user.setPhone(updates.get("phone") != null ? updates.get("phone").toString().trim() : null);
        }
        if (updates.containsKey("avatar") && updates.get("avatar") != null) {
            user.setAvatar(updates.get("avatar").toString());
        }
        if (updates.containsKey("bio")) {
            user.setBio(updates.get("bio") != null ? updates.get("bio").toString().trim() : null);
        }
        if (updates.containsKey("officeLocation")) {
            user.setOfficeLocation(updates.get("officeLocation") != null ? updates.get("officeLocation").toString().trim() : null);
        }
        if (updates.containsKey("qualification")) {
            user.setQualification(updates.get("qualification") != null ? updates.get("qualification").toString().trim() : null);
        }
        if (updates.containsKey("roleTitle") && updates.get("roleTitle") != null) {
            user.setRoleTitle(updates.get("roleTitle").toString().trim());
        }
        if (updates.containsKey("department") && updates.get("department") != null) {
            user.setDepartment(updates.get("department").toString().trim());
        }
        if (updates.containsKey("defaultAcademicYear") && updates.get("defaultAcademicYear") != null) {
            user.setDefaultAcademicYear(updates.get("defaultAcademicYear").toString().trim());
        }
        if (updates.containsKey("defaultDivision") && updates.get("defaultDivision") != null) {
            user.setDefaultDivision(updates.get("defaultDivision").toString().trim());
        }
        if (updates.containsKey("defaultBatchGroup") && updates.get("defaultBatchGroup") != null) {
            user.setDefaultBatchGroup(updates.get("defaultBatchGroup").toString().trim());
        }

        try {
            User savedUser = userRepository.save(user);

            // 2. Synchronize Student Records
            String role = user.getRole() != null ? user.getRole().toLowerCase() : "";
            if ("student".equals(role) || lookupEmail.endsWith("@sitcoe.org.in")) {
                Optional<Student> studentOpt = studentRepository.findByEmail(lookupEmail);
                Student student = studentOpt.orElseGet(() -> Student.builder()
                        .userId(savedUser.getId())
                        .email(lookupEmail)
                        .name(savedUser.getName())
                        .department(savedUser.getDepartment() != null ? savedUser.getDepartment() : "CSE")
                        .rollNo(updates.containsKey("rollNo") && updates.get("rollNo") != null ? updates.get("rollNo").toString().trim() : "TEMP-" + savedUser.getId())
                        .prn(updates.containsKey("prn") && updates.get("prn") != null ? updates.get("prn").toString().trim() : "PRN-" + savedUser.getId())
                        .academicYear(updates.containsKey("academicYear") && updates.get("academicYear") != null ? updates.get("academicYear").toString() : "SE")
                        .division(updates.containsKey("division") && updates.get("division") != null ? updates.get("division").toString() : "Div A")
                        .batchGroup(updates.containsKey("batchGroup") && updates.get("batchGroup") != null ? updates.get("batchGroup").toString() : "A1")
                        .cohortBatch("2024-2028")
                        .gpa(8.0)
                        .attendance(90.0)
                        .status("Active")
                        .build());

                student.setName(savedUser.getName());
                if (savedUser.getDepartment() != null) student.setDepartment(savedUser.getDepartment());
                if (updates.containsKey("rollNo") && updates.get("rollNo") != null) student.setRollNo(updates.get("rollNo").toString().trim());
                if (updates.containsKey("prn") && updates.get("prn") != null) student.setPrn(updates.get("prn").toString().trim());
                if (updates.containsKey("academicYear") && updates.get("academicYear") != null) student.setAcademicYear(updates.get("academicYear").toString().trim());
                if (updates.containsKey("division") && updates.get("division") != null) student.setDivision(updates.get("division").toString().trim());
                if (updates.containsKey("batchGroup") && updates.get("batchGroup") != null) student.setBatchGroup(updates.get("batchGroup").toString().trim());
                if (updates.containsKey("parentName")) student.setParentName(updates.get("parentName") != null ? updates.get("parentName").toString().trim() : null);
                if (updates.containsKey("parentEmail")) student.setParentEmail(updates.get("parentEmail") != null ? updates.get("parentEmail").toString().trim().toLowerCase() : null);
                if (updates.containsKey("parentPhone")) student.setParentPhone(updates.get("parentPhone") != null ? updates.get("parentPhone").toString().trim() : null);
                if (updates.containsKey("parentRelationship")) student.setParentRelationship(updates.get("parentRelationship") != null ? updates.get("parentRelationship").toString().trim() : "Father");

                if (updates.containsKey("gpa") && updates.get("gpa") != null) {
                    try {
                        student.setGpa(Double.parseDouble(updates.get("gpa").toString()));
                    } catch (Exception ignored) {}
                } else if (updates.containsKey("cgpa") && updates.get("cgpa") != null) {
                    try {
                        student.setGpa(Double.parseDouble(updates.get("cgpa").toString()));
                    } catch (Exception ignored) {}
                }

                Student savedStudent = studentRepository.save(student);

                // Synchronize Student Academic Marks
                String currentPrn = savedStudent.getPrn();
                if (currentPrn != null && !currentPrn.isBlank()) {
                    StudentAcademicData acad = studentAcademicDataRepository.findByPrn(currentPrn)
                            .orElseGet(() -> StudentAcademicData.builder()
                                    .studentId(savedStudent.getId())
                                    .prn(currentPrn)
                                    .build());

                    acad.setStudentId(savedStudent.getId());
                    acad.setPrn(currentPrn);

                    if (updates.containsKey("qualificationPath") && updates.get("qualificationPath") != null) {
                        acad.setQualificationPath(updates.get("qualificationPath").toString());
                    }
                    if (updates.containsKey("tenthPercentage") && updates.get("tenthPercentage") != null) {
                        try {
                            acad.setTenthPercentage(new BigDecimal(updates.get("tenthPercentage").toString()));
                        } catch (Exception ignored) {}
                    }
                    if (updates.containsKey("twelfthPercentage") && updates.get("twelfthPercentage") != null) {
                        try {
                            acad.setTwelfthPercentage(new BigDecimal(updates.get("twelfthPercentage").toString()));
                        } catch (Exception ignored) {}
                    }
                    if (updates.containsKey("diplomaPercentage") && updates.get("diplomaPercentage") != null) {
                        try {
                            acad.setDiplomaPercentage(new BigDecimal(updates.get("diplomaPercentage").toString()));
                        } catch (Exception ignored) {}
                    }
                    if (student.getGpa() != null) {
                        acad.setCgpa(BigDecimal.valueOf(student.getGpa()));
                    }
                    studentAcademicDataRepository.save(acad);
                }
            }

            // 3. Synchronize Faculty Records
            if ("faculty".equals(role) || "hod".equals(role)) {
                Optional<Faculty> facOpt = facultyRepository.findByEmail(lookupEmail);
                Faculty faculty = facOpt.orElseGet(() -> Faculty.builder()
                        .userId(savedUser.getId())
                        .email(lookupEmail)
                        .name(savedUser.getName())
                        .department(savedUser.getDepartment() != null ? savedUser.getDepartment() : "CSE")
                        .specialization(updates.containsKey("specialization") && updates.get("specialization") != null ? updates.get("specialization").toString().trim() : "General")
                        .rankTitle(updates.containsKey("designation") && updates.get("designation") != null ? updates.get("designation").toString().trim() : "Assistant Professor")
                        .designation(updates.containsKey("designation") && updates.get("designation") != null ? updates.get("designation").toString().trim() : "Assistant Professor")
                        .qualification(updates.containsKey("qualification") && updates.get("qualification") != null ? updates.get("qualification").toString().trim() : "Ph.D.")
                        .build());

                faculty.setName(savedUser.getName());
                if (savedUser.getDepartment() != null) faculty.setDepartment(savedUser.getDepartment());
                if (savedUser.getAvatar() != null) faculty.setAvatar(savedUser.getAvatar());
                if (updates.containsKey("qualification")) faculty.setQualification(updates.get("qualification") != null ? updates.get("qualification").toString() : null);
                if (updates.containsKey("specialization")) faculty.setSpecialization(updates.get("specialization") != null ? updates.get("specialization").toString() : null);
                if (updates.containsKey("designation")) {
                    faculty.setDesignation(updates.get("designation") != null ? updates.get("designation").toString() : null);
                    faculty.setRankTitle(faculty.getDesignation());
                }
                if (updates.containsKey("roleTitle")) faculty.setRankTitle(updates.get("roleTitle") != null ? updates.get("roleTitle").toString() : null);
                if (updates.containsKey("teachingExperience")) faculty.setTeachingExperience(updates.get("teachingExperience") != null ? updates.get("teachingExperience").toString() : null);
                if (updates.containsKey("industrialExperience")) faculty.setIndustrialExperience(updates.get("industrialExperience") != null ? updates.get("industrialExperience").toString() : null);
                if (updates.containsKey("officeHours")) faculty.setOfficeHours(updates.get("officeHours") != null ? updates.get("officeHours").toString() : null);
                if (updates.containsKey("defaultAcademicYear")) faculty.setDefaultAcademicYear(updates.get("defaultAcademicYear") != null ? updates.get("defaultAcademicYear").toString() : null);
                if (updates.containsKey("defaultDivision")) faculty.setDefaultDivision(updates.get("defaultDivision") != null ? updates.get("defaultDivision").toString() : null);
                if (updates.containsKey("defaultBatchGroup")) faculty.setDefaultBatchGroup(updates.get("defaultBatchGroup") != null ? updates.get("defaultBatchGroup").toString() : null);
                facultyRepository.save(faculty);
            }

            // 4. Synchronize Parent Records
            if ("parent".equals(role)) {
                Optional<Parent> parentOpt = parentRepository.findByUserId(savedUser.getId());
                if (parentOpt.isPresent()) {
                    Parent p = parentOpt.get();
                    if (savedUser.getPhone() != null) p.setAlternatePhone(savedUser.getPhone());
                    if (updates.containsKey("parentRelationship") && updates.get("parentRelationship") != null) {
                        p.setRelationship(updates.get("parentRelationship").toString());
                    }
                    parentRepository.save(p);
                }
            }

            Map<String, Object> enrichedProfile = buildEnrichedProfile(savedUser, lookupEmail);

            Map<String, Object> res = new HashMap<>();
            res.put("status", "success");
            res.put("message", "User profile updated successfully.");
            res.put("user", enrichedProfile);
            return ResponseEntity.ok(res);

        } catch (Exception e) {
            e.printStackTrace();
            Map<String, String> err = new HashMap<>();
            err.put("message", "Failed to update user profile due to server error: " + e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestParam(required = false) String email,
            Authentication authentication,
            @RequestBody Map<String, String> request
    ) {
        String lookupEmail = (authentication != null && authentication.getName() != null && !authentication.getName().equals("anonymousUser"))
                ? authentication.getName().trim().toLowerCase()
                : (request.containsKey("email") && request.get("email") != null
                    ? request.get("email").trim().toLowerCase()
                    : (email != null ? email.trim().toLowerCase() : null));

        if (lookupEmail == null || lookupEmail.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "User is not authenticated.");
            return ResponseEntity.status(401).body(err);
        }

        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        if (currentPassword == null || newPassword == null || newPassword.length() < 4) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Current password and new password (min 4 characters) are required.");
            return ResponseEntity.badRequest().body(err);
        }

        Optional<User> userOpt = userRepository.findByEmail(lookupEmail);

        if (userOpt.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "User not found.");
            return ResponseEntity.status(404).body(err);
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Current password is incorrect.");
            return ResponseEntity.badRequest().body(err);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        Map<String, String> res = new HashMap<>();
        res.put("status", "success");
        res.put("message", "Password changed successfully.");
        return ResponseEntity.ok(res);
    }

    @PutMapping("/default-batch")
    public ResponseEntity<?> saveDefaultBatch(
            @RequestParam(required = false) String email,
            Authentication authentication,
            @RequestBody Map<String, Object> batchData
    ) {
        String lookupEmail = (authentication != null && authentication.getName() != null && !authentication.getName().equals("anonymousUser"))
                ? authentication.getName().trim().toLowerCase()
                : (batchData.containsKey("email") && batchData.get("email") != null
                    ? batchData.get("email").toString().trim().toLowerCase()
                    : (email != null ? email.trim().toLowerCase() : null));

        if (lookupEmail == null || lookupEmail.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "User is not authenticated.");
            return ResponseEntity.status(401).body(err);
        }

        String academicYear = batchData.containsKey("academicYear") && batchData.get("academicYear") != null ? batchData.get("academicYear").toString().trim() : "TE";
        String division = batchData.containsKey("division") && batchData.get("division") != null ? batchData.get("division").toString().trim() : "Div A";
        String batchGroup = batchData.containsKey("batchGroup") && batchData.get("batchGroup") != null ? batchData.get("batchGroup").toString().trim() : "ALL";
        String department = batchData.containsKey("department") && batchData.get("department") != null ? batchData.get("department").toString().trim() : null;

        Optional<User> userOpt = userRepository.findByEmail(lookupEmail);
        User user = userOpt.orElseGet(() -> {
            User newUser = User.builder()
                    .email(lookupEmail)
                    .name(lookupEmail.split("@")[0])
                    .role("faculty")
                    .department(department != null ? department : "CSE")
                    .password(passwordEncoder.encode("DefaultPass123!"))
                    .build();
            return userRepository.save(newUser);
        });

        user.setDefaultAcademicYear(academicYear);
        user.setDefaultDivision(division);
        user.setDefaultBatchGroup(batchGroup);
        if (department != null && !department.isBlank()) {
            user.setDepartment(department);
        }
        User savedUser = userRepository.save(user);

        facultyRepository.findByEmail(lookupEmail).ifPresent(f -> {
            f.setDefaultAcademicYear(academicYear);
            f.setDefaultDivision(division);
            f.setDefaultBatchGroup(batchGroup);
            if (department != null && !department.isBlank()) {
                f.setDepartment(department);
            }
            facultyRepository.save(f);
        });

        Map<String, Object> res = new HashMap<>();
        res.put("status", "success");
        res.put("message", "Default working batch saved successfully.");
        res.put("defaultBatch", Map.of(
                "academicYear", academicYear,
                "division", division,
                "batchGroup", batchGroup,
                "department", savedUser.getDepartment() != null ? savedUser.getDepartment() : "CSE"
        ));
        return ResponseEntity.ok(res);
    }

    private Map<String, Object> buildEnrichedProfile(User user, String email) {
        Map<String, Object> profileMap = new HashMap<>();
        profileMap.put("id", user.getId());
        profileMap.put("name", user.getName());
        profileMap.put("email", user.getEmail());
        profileMap.put("role", user.getRole());
        profileMap.put("roleTitle", user.getRoleTitle());
        profileMap.put("department", user.getDepartment());
        profileMap.put("phone", user.getPhone());
        profileMap.put("avatar", user.getAvatar());
        profileMap.put("bio", user.getBio());
        profileMap.put("officeLocation", user.getOfficeLocation());
        profileMap.put("qualification", user.getQualification());

        // Default Working Batch
        profileMap.put("defaultAcademicYear", user.getDefaultAcademicYear());
        profileMap.put("defaultDivision", user.getDefaultDivision());
        profileMap.put("defaultBatchGroup", user.getDefaultBatchGroup());

        // Student Data
        Optional<Student> studentOpt = studentRepository.findByEmail(email);
        if (studentOpt.isPresent()) {
            Student s = studentOpt.get();
            profileMap.put("prn", s.getPrn());
            profileMap.put("rollNo", s.getRollNo());
            profileMap.put("academicYear", s.getAcademicYear());
            profileMap.put("division", s.getDivision());
            profileMap.put("batchGroup", s.getBatchGroup());
            profileMap.put("cohortBatch", s.getCohortBatch());
            profileMap.put("gpa", s.getGpa());
            profileMap.put("cgpa", s.getGpa());
            profileMap.put("attendance", s.getAttendance());
            profileMap.put("parentName", s.getParentName());
            profileMap.put("parentEmail", s.getParentEmail());
            profileMap.put("parentPhone", s.getParentPhone());
            profileMap.put("parentRelationship", s.getParentRelationship());

            if (s.getPrn() != null && !s.getPrn().isBlank()) {
                studentAcademicDataRepository.findByPrn(s.getPrn()).ifPresent(acad -> {
                    profileMap.put("qualificationPath", acad.getQualificationPath());
                    profileMap.put("tenthPercentage", acad.getTenthPercentage());
                    profileMap.put("twelfthPercentage", acad.getTwelfthPercentage());
                    profileMap.put("diplomaPercentage", acad.getDiplomaPercentage());
                    if (acad.getCgpa() != null && acad.getCgpa().doubleValue() > 0) {
                        profileMap.put("cgpa", acad.getCgpa().doubleValue());
                    }
                });
            }
        }

        // Faculty Data
        Optional<Faculty> facOpt = facultyRepository.findByEmail(email);
        if (facOpt.isPresent()) {
            Faculty f = facOpt.get();
            profileMap.put("specialization", f.getSpecialization());
            profileMap.put("designation", f.getDesignation() != null ? f.getDesignation() : f.getRankTitle());
            profileMap.put("rankTitle", f.getRankTitle());
            profileMap.put("rank", f.getRank());
            profileMap.put("qualification", f.getQualification() != null ? f.getQualification() : user.getQualification());
            profileMap.put("teachingExperience", f.getTeachingExperience());
            profileMap.put("industrialExperience", f.getIndustrialExperience());
            profileMap.put("officeHours", f.getOfficeHours());
            profileMap.put("status", f.getStatus());

            if (user.getDefaultAcademicYear() == null && f.getDefaultAcademicYear() != null) {
                profileMap.put("defaultAcademicYear", f.getDefaultAcademicYear());
            }
            if (user.getDefaultDivision() == null && f.getDefaultDivision() != null) {
                profileMap.put("defaultDivision", f.getDefaultDivision());
            }
            if (user.getDefaultBatchGroup() == null && f.getDefaultBatchGroup() != null) {
                profileMap.put("defaultBatchGroup", f.getDefaultBatchGroup());
            }
        }

        // Parent Data
        Optional<Parent> parentOpt = parentRepository.findByUserId(user.getId());
        if (parentOpt.isPresent()) {
            Parent p = parentOpt.get();
            profileMap.put("parentRelationship", p.getRelationship());
            profileMap.put("studentRollNo", p.getStudentRollNo());
        }

        return profileMap;
    }
}

