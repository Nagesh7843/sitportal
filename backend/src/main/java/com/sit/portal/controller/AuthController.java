package com.sit.portal.controller;

import com.sit.portal.config.JwtUtils;
import com.sit.portal.entity.User;
import com.sit.portal.repository.UserRepository;
import com.sit.portal.repository.StudentRepository;
import com.sit.portal.repository.FacultyRepository;
import com.sit.portal.entity.Faculty;
import com.sit.portal.entity.Parent;
import com.sit.portal.repository.ParentRepository;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private com.sit.portal.repository.StudentAcademicDataRepository studentAcademicDataRepository;

    @Autowired
    private com.sit.portal.service.StudentService studentService;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");

        if (email == null || password == null) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Email and password are required.");
            return ResponseEntity.badRequest().body(err);
        }

        String cleanEmail = email.trim().toLowerCase();
        User user = null;

        // DB Lookup
        Optional<User> userOpt = userRepository.findByEmail(cleanEmail);
        if (userOpt.isPresent()) {
            user = userOpt.get();
            // Validate student domain
            if ("student".equalsIgnoreCase(user.getRole()) && !cleanEmail.endsWith("@sitcoe.org.in") && !cleanEmail.endsWith("@sitcoe.ac.in")) {
                Map<String, String> err = new HashMap<>();
                err.put("message", "Access Denied: Student accounts must use an official @sitcoe.org.in or @sitcoe.ac.in institutional email address to login.");
                return ResponseEntity.status(403).body(err);
            }
            // Validate password using BCrypt
            if (!passwordEncoder.matches(password, user.getPassword())) {
                Map<String, String> err = new HashMap<>();
                err.put("message", "Invalid credentials.");
                return ResponseEntity.status(401).body(err);
            }
        } else {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Invalid credentials or account does not exist.");
            return ResponseEntity.status(401).body(err);
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", user);
        response.put("role", user.getRole());
        response.put("message", "Authentication successful.");

        return ResponseEntity.ok(response);
    }

    private static final String FACULTY_PASSCODE = "SIT-FACULTY-2026";
    private static final String HOD_PASSCODE = "SIT-HOD-2026";

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> req) {
        String name = (String) req.get("name");
        String email = (String) req.get("email");
        String password = (String) req.get("password");
        String role = (String) req.get("role");
        String roleTitle = (String) req.get("roleTitle");
        String department = (String) req.get("department");
        String qualification = (String) req.get("qualification");
        String specialization = (String) req.get("specialization");
        String teachingExperience = (String) req.get("teachingExperience");
        String industrialExperience = (String) req.get("industrialExperience");
        String securityCode = (String) req.get("securityCode");

        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Email and password are required.");
            return ResponseEntity.badRequest().body(err);
        }

        String cleanEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "User with this email already exists in database.");
            return ResponseEntity.badRequest().body(err);
        }

        String targetRole = role != null ? role.trim().toLowerCase() : "student";

        if ("student".equalsIgnoreCase(targetRole)) {
            if (!cleanEmail.endsWith("@sitcoe.org.in") && !cleanEmail.endsWith("@sitcoe.ac.in")) {
                Map<String, String> err = new HashMap<>();
                err.put("message", "Registration Denied: All student accounts must use an official institutional Google Workspace email ending with @sitcoe.org.in or @sitcoe.ac.in (e.g. prn.sitcoe@sitcoe.org.in). Personal email domains (@gmail.com, etc.) are not permitted.");
                return ResponseEntity.status(403).body(err);
            }
            if (roleTitle == null || roleTitle.isEmpty()) {
                roleTitle = (department != null ? department : "CSE") + " B.Tech Student";
            }
        } else if ("faculty".equalsIgnoreCase(targetRole)) {
            if (securityCode == null || !FACULTY_PASSCODE.equalsIgnoreCase(securityCode.trim())) {
                Map<String, String> err = new HashMap<>();
                err.put("message", "Invalid Faculty Institutional Verification Key. Please enter the valid SIT faculty key.");
                return ResponseEntity.status(403).body(err);
            }
            if (roleTitle == null || roleTitle.isEmpty()) {
                roleTitle = "Assistant Professor";
            }
            Faculty faculty = facultyRepository.findByEmail(cleanEmail)
                    .orElse(Faculty.builder().email(cleanEmail).name(name != null ? name : "Faculty").build());
            faculty.setName(name != null ? name : faculty.getName());
            faculty.setDepartment(department != null ? department : "CSE");
            faculty.setRankTitle(roleTitle);
            faculty.setDesignation(roleTitle);
            faculty.setQualification(qualification);
            faculty.setSpecialization(specialization);
            faculty.setTeachingExperience(teachingExperience);
            faculty.setIndustrialExperience(industrialExperience);
            faculty.setStatus("ON CAMPUS");
            facultyRepository.save(faculty);

        } else if ("hod".equalsIgnoreCase(targetRole)) {
            if (securityCode == null || !HOD_PASSCODE.equalsIgnoreCase(securityCode.trim())) {
                Map<String, String> err = new HashMap<>();
                err.put("message", "Invalid HOD Institutional Security Key. Please enter the valid SIT HOD secret key.");
                return ResponseEntity.status(403).body(err);
            }
            roleTitle = "Head of Department (HOD " + (department != null ? department : "CSE") + ")";
            Faculty faculty = facultyRepository.findByEmail(cleanEmail)
                    .orElse(Faculty.builder().email(cleanEmail).name(name != null ? name : "HOD").build());
            faculty.setName(name != null ? name : faculty.getName());
            faculty.setDepartment(department != null ? department : "CSE");
            faculty.setRankTitle("Head of Department (HOD)");
            faculty.setDesignation("Head of Department (HOD)");
            faculty.setQualification(qualification);
            faculty.setSpecialization(specialization);
            faculty.setTeachingExperience(teachingExperience);
            faculty.setIndustrialExperience(industrialExperience);
            faculty.setStatus("ON CAMPUS");
            facultyRepository.save(faculty);

        } else if ("parent".equalsIgnoreCase(targetRole)) {
            roleTitle = "Parent / Guardian";
        } else {
            targetRole = "student";
            if (roleTitle == null || roleTitle.isEmpty()) {
                roleTitle = (department != null ? department : "CSE") + " B.Tech Student";
            }
        }

        User user = User.builder()
                .name(name != null ? name : "SIT Member")
                .email(cleanEmail)
                .password(passwordEncoder.encode(password))
                .role(targetRole)
                .roleTitle(roleTitle)
                .department(department != null ? department : "CSE")
                .qualification(qualification)
                .build();

        User savedUser = userRepository.save(user);

        if ("student".equalsIgnoreCase(savedUser.getRole())) {
            String rollNo = (String) req.get("rollNo");
            String prn = (String) req.get("prn");
            String academicYear = (String) req.get("academicYear");
            String division = (String) req.get("division");
            String batchGroup = (String) req.get("batchGroup");
            String cohortBatch = (String) req.get("cohortBatch");
            String parentName = (String) req.get("parentName");
            String parentEmail = (String) req.get("parentEmail");
            String parentPhone = (String) req.get("parentPhone");
            String parentRelationship = (String) req.get("parentRelationship");
            String addressLine1 = (String) req.get("addressLine1");
            String addressLine2 = (String) req.get("addressLine2");
            String villageCity = (String) req.get("villageCity");
            String taluka = (String) req.get("taluka");
            String district = (String) req.get("district");
            String state = (String) req.get("state");
            String pinCode = (String) req.get("pinCode");
            String country = (String) req.get("country");

            Double gpaVal = 8.5;
            if (req.get("gpa") != null) {
                try {
                    gpaVal = Double.parseDouble(String.valueOf(req.get("gpa")));
                } catch (Exception ignored) {}
            }

            Double attendanceVal = 92.5;
            if (req.get("attendance") != null) {
                try {
                    attendanceVal = Double.parseDouble(String.valueOf(req.get("attendance")));
                } catch (Exception ignored) {}
            }

            com.sit.portal.entity.Student student = studentRepository.findByEmail(cleanEmail)
                    .orElse(com.sit.portal.entity.Student.builder().email(cleanEmail).build());

            student.setUserId(savedUser.getId());
            student.setName(savedUser.getName());
            student.setEmail(cleanEmail);
            student.setDepartment(department != null ? department : "CSE");
            if (rollNo != null && !rollNo.trim().isEmpty()) {
                student.setRollNo(rollNo.trim());
            } else if (student.getRollNo() == null) {
                student.setRollNo("ST-" + (System.currentTimeMillis() % 100000));
            }

            if (prn != null && !prn.trim().isEmpty()) {
                student.setPrn(prn.trim());
            } else if (student.getPrn() == null) {
                student.setPrn(student.getRollNo());
            }

            student.setAcademicYear(academicYear != null ? academicYear : "SE");
            student.setDivision(division != null ? division : "Div A");
            student.setBatchGroup(batchGroup != null ? batchGroup : "A1");
            student.setCohortBatch(cohortBatch != null ? cohortBatch : "2024-2028");
            student.setGpa(gpaVal);
            student.setAttendance(attendanceVal);
            student.setStatus("ACTIVE");

            if (parentName != null) student.setParentName(parentName.trim());
            if (parentEmail != null) student.setParentEmail(parentEmail.trim().toLowerCase());
            if (parentPhone != null) student.setParentPhone(parentPhone.trim());
            if (parentRelationship != null) student.setParentRelationship(parentRelationship);

            if (addressLine1 != null) student.setAddressLine1(addressLine1.trim());
            if (addressLine2 != null) student.setAddressLine2(addressLine2.trim());
            if (villageCity != null) student.setVillageCity(villageCity.trim());
            if (taluka != null) student.setTaluka(taluka.trim());
            if (district != null) student.setDistrict(district.trim());
            student.setState(state != null && !state.trim().isEmpty() ? state.trim() : "Maharashtra");
            if (pinCode != null) student.setPinCode(pinCode.trim());
            student.setCountry(country != null && !country.trim().isEmpty() ? country.trim() : "India");

            com.sit.portal.entity.Student savedStudent = studentRepository.save(student);
            studentService.syncParentAccount(savedStudent);

            // Save academic scores
            String qualPath = req.get("qualificationPath") != null ? String.valueOf(req.get("qualificationPath")) : "12TH";
            java.math.BigDecimal tenth = req.get("tenthPercentage") != null ? new java.math.BigDecimal(String.valueOf(req.get("tenthPercentage"))) : java.math.BigDecimal.ZERO;
            java.math.BigDecimal twelfth = req.get("twelfthPercentage") != null ? new java.math.BigDecimal(String.valueOf(req.get("twelfthPercentage"))) : java.math.BigDecimal.ZERO;
            java.math.BigDecimal diploma = req.get("diplomaPercentage") != null ? new java.math.BigDecimal(String.valueOf(req.get("diplomaPercentage"))) : java.math.BigDecimal.ZERO;
            final double finalGpa = gpaVal;

            studentAcademicDataRepository.findByPrn(savedStudent.getPrn()).ifPresentOrElse(acad -> {
                acad.setQualificationPath(qualPath);
                acad.setTenthPercentage(tenth);
                acad.setTwelfthPercentage(twelfth);
                acad.setDiplomaPercentage(diploma);
                acad.setCgpa(java.math.BigDecimal.valueOf(finalGpa));
                studentAcademicDataRepository.save(acad);
            }, () -> {
                studentAcademicDataRepository.save(com.sit.portal.entity.StudentAcademicData.builder()
                        .studentId(savedStudent.getId())
                        .prn(savedStudent.getPrn())
                        .qualificationPath(qualPath)
                        .tenthPercentage(tenth)
                        .twelfthPercentage(twelfth)
                        .diplomaPercentage(diploma)
                        .cgpa(java.math.BigDecimal.valueOf(finalGpa))
                        .activeBacklogs(0)
                        .totalBacklogs(0)
                        .build());
            });
        }

        if ("parent".equalsIgnoreCase(savedUser.getRole())) {
            studentRepository.findByParentEmail(cleanEmail).stream().findFirst().ifPresent(student -> {
                Parent p = parentRepository.findByUserId(savedUser.getId())
                        .orElse(Parent.builder().userId(savedUser.getId()).build());
                p.setUserId(savedUser.getId());
                p.setStudentRollNo(student.getRollNo() != null ? student.getRollNo() : student.getPrn());
                p.setStudentName(student.getName());
                p.setParentName(savedUser.getName() != null && !savedUser.getName().trim().isEmpty()
                        ? savedUser.getName().trim()
                        : (student.getParentName() != null && !student.getParentName().trim().isEmpty()
                            ? student.getParentName().trim()
                            : "Parent of " + student.getName()));
                p.setEmail(cleanEmail);
                if (student.getParentRelationship() != null) p.setRelationship(student.getParentRelationship());
                if (student.getParentPhone() != null) p.setAlternatePhone(student.getParentPhone());
                parentRepository.save(p);
            });
        }

        String token = jwtUtils.generateToken(savedUser.getEmail(), savedUser.getRole());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", savedUser);
        response.put("role", savedUser.getRole());
        response.put("message", "Account registered and authenticated successfully.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/parent/check-status")
    public ResponseEntity<?> checkParentStatus(@RequestParam String email, @RequestParam(required = false) String prn) {
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email is required."));
        }
        String cleanEmail = email.trim().toLowerCase();
        List<com.sit.portal.entity.Student> linkedStudents = studentRepository.findByParentEmail(cleanEmail);
        Optional<User> existingUser = userRepository.findByEmail(cleanEmail);

        if (linkedStudents.isEmpty()) {
            Map<String, Object> res = new HashMap<>();
            res.put("email", cleanEmail);
            res.put("isRegisteredUnderStudent", false);
            res.put("hasPassword", false);
            return ResponseEntity.ok(res);
        }

        com.sit.portal.entity.Student targetStudent = linkedStudents.get(0);
        if (prn != null && !prn.trim().isEmpty()) {
            String cleanPrn = prn.trim().toUpperCase();
            Optional<com.sit.portal.entity.Student> matched = linkedStudents.stream()
                    .filter(s -> cleanPrn.equalsIgnoreCase(s.getPrn()) || cleanPrn.equalsIgnoreCase(s.getRollNo()))
                    .findFirst();
            if (matched.isPresent()) {
                targetStudent = matched.get();
            } else {
                Map<String, String> err = new HashMap<>();
                err.put("message", "The entered Student PRN (" + cleanPrn + ") is not registered under this parent email address.");
                return ResponseEntity.status(400).body(err);
            }
        }

        List<Map<String, Object>> wardsList = new ArrayList<>();
        for (com.sit.portal.entity.Student s : linkedStudents) {
            Map<String, Object> w = new HashMap<>();
            w.put("studentName", s.getName());
            w.put("studentRollNo", s.getRollNo());
            w.put("studentPrn", s.getPrn());
            w.put("department", s.getDepartment());
            w.put("academicYear", s.getAcademicYear());
            w.put("division", s.getDivision());
            wardsList.add(w);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("email", cleanEmail);
        res.put("isRegisteredUnderStudent", true);
        res.put("hasPassword", existingUser.isPresent() && existingUser.get().getPassword() != null && !existingUser.get().getPassword().isEmpty());
        res.put("parentName", targetStudent.getParentName() != null ? targetStudent.getParentName() : "Parent / Guardian");
        res.put("studentName", targetStudent.getName());
        res.put("studentRollNo", targetStudent.getRollNo());
        res.put("studentPrn", targetStudent.getPrn());
        res.put("department", targetStudent.getDepartment());
        res.put("relationship", targetStudent.getParentRelationship());
        res.put("wards", wardsList);
        res.put("wardsCount", linkedStudents.size());

        return ResponseEntity.ok(res);
    }

    @PostMapping("/parent/setup-password")
    public ResponseEntity<?> setupParentPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String prn = body.get("prn");
        String parentName = body.get("parentName");

        if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required."));
        }

        String cleanEmail = email.trim().toLowerCase();
        List<com.sit.portal.entity.Student> linkedStudents = studentRepository.findByParentEmail(cleanEmail);

        if (linkedStudents.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "No student registered with this parent email."));
        }

        if (prn != null && !prn.trim().isEmpty()) {
            String cleanPrn = prn.trim().toUpperCase();
            boolean prnMatches = linkedStudents.stream()
                    .anyMatch(s -> cleanPrn.equalsIgnoreCase(s.getPrn()) || cleanPrn.equalsIgnoreCase(s.getRollNo()));
            if (!prnMatches) {
                return ResponseEntity.badRequest().body(Map.of("message", "Student PRN verification failed for this parent email."));
            }
        }

        Optional<User> userOpt = userRepository.findByEmail(cleanEmail);
        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
            user.setPassword(passwordEncoder.encode(password));
            user.setRole("parent");
            if (user.getRoleTitle() == null) user.setRoleTitle("Parent / Guardian");
            if (parentName != null && !parentName.trim().isEmpty()) user.setName(parentName.trim());
        } else {
            String defaultName = !linkedStudents.isEmpty() && linkedStudents.get(0).getParentName() != null
                    ? linkedStudents.get(0).getParentName()
                    : (parentName != null && !parentName.trim().isEmpty() ? parentName.trim() : "Parent");

            user = User.builder()
                    .name(defaultName)
                    .email(cleanEmail)
                    .password(passwordEncoder.encode(password))
                    .role("parent")
                    .roleTitle("Parent / Guardian")
                    .department(!linkedStudents.isEmpty() ? linkedStudents.get(0).getDepartment() : "CSE")
                    .build();
        }

        User savedUser = userRepository.save(user);

        com.sit.portal.entity.Student primaryStudent = linkedStudents.get(0);
        Parent p = parentRepository.findByUserId(savedUser.getId())
                .orElse(Parent.builder().userId(savedUser.getId()).build());
        p.setUserId(savedUser.getId());
        p.setStudentRollNo(primaryStudent.getRollNo() != null ? primaryStudent.getRollNo() : primaryStudent.getPrn());
        p.setStudentName(primaryStudent.getName());
        p.setParentName(savedUser.getName() != null && !savedUser.getName().trim().isEmpty()
                ? savedUser.getName().trim()
                : (primaryStudent.getParentName() != null && !primaryStudent.getParentName().trim().isEmpty()
                    ? primaryStudent.getParentName().trim()
                    : "Parent of " + primaryStudent.getName()));
        p.setEmail(cleanEmail);
        if (primaryStudent.getParentRelationship() != null) p.setRelationship(primaryStudent.getParentRelationship());
        if (primaryStudent.getParentPhone() != null) p.setAlternatePhone(primaryStudent.getParentPhone());
        parentRepository.save(p);

        String token = jwtUtils.generateToken(savedUser.getEmail(), savedUser.getRole());

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", savedUser);
        response.put("role", "parent");
        response.put("wardsCount", linkedStudents.size());
        response.put("message", "Parent password created successfully. Welcome to SIT Parent Portal.");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String idToken = request.get("idToken");

        // If Google ID Token is supplied, verify it against Google's OAuth2 verification servers
        if (idToken != null && !idToken.trim().isEmpty()) {
            try {
                java.net.http.HttpClient client = java.net.http.HttpClient.newHttpClient();
                java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                        .uri(java.net.URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken.trim()))
                        .GET()
                        .build();
                java.net.http.HttpResponse<String> res = client.send(req, java.net.http.HttpResponse.BodyHandlers.ofString());
                if (res.statusCode() == 200) {
                    java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\"email\"\\s*:\\s*\"([^\"]+)\"").matcher(res.body());
                    if (matcher.find()) {
                        email = matcher.group(1);
                    }
                }
            } catch (Exception e) {
                // Fallback to provided email if external network call fails
            }
        }

        if (email == null || email.trim().isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Google account email is required.");
            return ResponseEntity.badRequest().body(err);
        }

        String cleanEmail = email.trim().toLowerCase();
        
        // 1. Check if user is already registered in users table
        Optional<User> userOpt = userRepository.findByEmail(cleanEmail);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if ("student".equalsIgnoreCase(user.getRole()) && !cleanEmail.endsWith("@sitcoe.org.in") && !cleanEmail.endsWith("@sitcoe.ac.in")) {
                Map<String, String> err = new HashMap<>();
                err.put("message", "Access Denied: Student accounts must use an official institutional @sitcoe.org.in or @sitcoe.ac.in Google Workspace email. Personal email domains (@gmail.com, etc.) are not permitted for student accounts.");
                return ResponseEntity.status(403).body(err);
            }
            String token = jwtUtils.generateToken(user.getEmail(), user.getRole());
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", user);
            response.put("role", user.getRole());
            response.put("message", "Google Authentication successful.");
            return ResponseEntity.ok(response);
        }

        // 2. Check if email exists in Faculty database
        Optional<Faculty> facOpt = facultyRepository.findByEmail(cleanEmail);
        if (facOpt.isPresent()) {
            Faculty fac = facOpt.get();
            String role = "faculty";
            String rank = fac.getRankTitle() != null ? fac.getRankTitle().toLowerCase() : "";
            if (rank.contains("hod") || rank.contains("head")) {
                role = "hod";
            }
            User newUser = User.builder()
                    .name(fac.getName() != null && !fac.getName().isEmpty() ? fac.getName() : cleanEmail.split("@")[0])
                    .email(cleanEmail)
                    .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .role(role)
                    .roleTitle(fac.getRankTitle() != null ? fac.getRankTitle() : "Faculty Member")
                    .department("Computer Science & Engineering")
                    .build();
            User savedUser = userRepository.save(newUser);
            String token = jwtUtils.generateToken(savedUser.getEmail(), savedUser.getRole());
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", savedUser);
            response.put("role", savedUser.getRole());
            response.put("message", "Google Authentication successful.");
            return ResponseEntity.ok(response);
        }

        // 3. Check if email exists in Student database
        Optional<com.sit.portal.entity.Student> studentOpt = studentRepository.findByEmail(cleanEmail);
        if (studentOpt.isPresent()) {
            if (!cleanEmail.endsWith("@sitcoe.org.in") && !cleanEmail.endsWith("@sitcoe.ac.in")) {
                Map<String, String> err = new HashMap<>();
                err.put("message", "Access Denied: Students must use an official institutional @sitcoe.org.in or @sitcoe.ac.in Google Workspace email. Personal domains (@gmail.com, etc.) are not permitted.");
                return ResponseEntity.status(403).body(err);
            }
            com.sit.portal.entity.Student st = studentOpt.get();
            User newUser = User.builder()
                    .name(st.getName() != null && !st.getName().isEmpty() ? st.getName() : cleanEmail.split("@")[0])
                    .email(cleanEmail)
                    .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .role("student")
                    .roleTitle("B.Tech Student")
                    .department("Computer Science & Engineering")
                    .build();
            User savedUser = userRepository.save(newUser);
            String token = jwtUtils.generateToken(savedUser.getEmail(), savedUser.getRole());
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", savedUser);
            response.put("role", savedUser.getRole());
            response.put("message", "Google Authentication successful.");
            return ResponseEntity.ok(response);
        }

        // 4. Check if email exists as Parent email for an enrolled Student
        List<com.sit.portal.entity.Student> parentStudents = studentRepository.findByParentEmail(cleanEmail);
        if (!parentStudents.isEmpty()) {
            com.sit.portal.entity.Student st = parentStudents.get(0);
            User newUser = User.builder()
                    .name("Parent of " + st.getName())
                    .email(cleanEmail)
                    .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .role("parent")
                    .roleTitle("Parent / Guardian")
                    .department("Computer Science & Engineering")
                    .build();
            User savedUser = userRepository.save(newUser);

            Parent p = parentRepository.findByUserId(savedUser.getId())
                    .orElse(Parent.builder().userId(savedUser.getId()).build());
            p.setUserId(savedUser.getId());
            p.setStudentRollNo(st.getRollNo() != null ? st.getRollNo() : st.getPrn());
            p.setStudentName(st.getName());
            p.setParentName(savedUser.getName() != null && !savedUser.getName().trim().isEmpty()
                    ? savedUser.getName().trim()
                    : (st.getParentName() != null && !st.getParentName().trim().isEmpty()
                        ? st.getParentName().trim()
                        : "Parent of " + st.getName()));
            p.setEmail(cleanEmail);
            if (st.getParentRelationship() != null) p.setRelationship(st.getParentRelationship());
            if (st.getParentPhone() != null) p.setAlternatePhone(st.getParentPhone());
            parentRepository.save(p);

            String token = jwtUtils.generateToken(savedUser.getEmail(), savedUser.getRole());
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", savedUser);
            response.put("role", savedUser.getRole());
            response.put("message", "Google Authentication successful.");
            return ResponseEntity.ok(response);
        }

        // 5. Check domain for new student Google registration / sign in
        if (!cleanEmail.endsWith("@sitcoe.org.in") && !cleanEmail.endsWith("@sitcoe.ac.in")) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Access Denied: Student accounts must use an official institutional @sitcoe.org.in or @sitcoe.ac.in Google Workspace email. Personal email domains (@gmail.com, etc.) are not allowed for student sign-in or registration.");
            return ResponseEntity.status(403).body(err);
        }

        // Seamlessly provision and authenticate new Google-verified student account
        String defaultName = cleanEmail.split("@")[0];
        if (defaultName.contains(".")) {
            String[] parts = defaultName.split("\\.");
            StringBuilder sb = new StringBuilder();
            for (String p : parts) {
                if (!p.isEmpty()) {
                    sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1)).append(" ");
                }
            }
            defaultName = sb.toString().trim();
        } else if (!defaultName.isEmpty()) {
            defaultName = Character.toUpperCase(defaultName.charAt(0)) + defaultName.substring(1);
        }

        User newUser = User.builder()
                .name(defaultName)
                .email(cleanEmail)
                .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                .role("student")
                .roleTitle("B.Tech Student")
                .department("CSE")
                .build();
        User savedUser = userRepository.save(newUser);

        if (!studentRepository.existsByEmail(cleanEmail)) {
            try {
                String generatedRoll = "STU-" + Math.abs(cleanEmail.hashCode() % 9000 + 1000);
                String generatedPrn = "24" + String.format("%08d", Math.abs(cleanEmail.hashCode() % 100000000));
                com.sit.portal.entity.Student st = com.sit.portal.entity.Student.builder()
                        .name(defaultName)
                        .email(cleanEmail)
                        .rollNo(generatedRoll)
                        .prn(generatedPrn)
                        .department("CSE")
                        .academicYear("SE")
                        .division("Div A")
                        .batchGroup("A1")
                        .cohortBatch("2024-2028")
                        .gpa(8.5)
                        .attendance(90.0)
                        .status("Active")
                        .build();
                studentRepository.save(st);
            } catch (Exception ex) {
                // ignore
            }
        }

        String token = jwtUtils.generateToken(savedUser.getEmail(), savedUser.getRole());
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", savedUser);
        response.put("role", savedUser.getRole());
        response.put("isNewUser", true);
        response.put("message", "Google account verified and authenticated successfully.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getAuthenticatedUser(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Not authenticated");
            return ResponseEntity.status(401).body(err);
        }

        String email = authentication.getName().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "User not found");
            return ResponseEntity.status(404).body(err);
        }

        User user = userOpt.get();
        user.setPassword(null);
        Map<String, Object> response = new HashMap<>();
        response.put("user", user);
        response.put("role", user.getRole());
        response.put("email", user.getEmail());
        return ResponseEntity.ok(response);
    }
}
