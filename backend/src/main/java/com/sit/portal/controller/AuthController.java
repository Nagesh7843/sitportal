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

import java.util.HashMap;
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

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User userRequest) {
        String cleanEmail = userRequest.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "User with this email already exists in PostgreSQL database.");
            return ResponseEntity.badRequest().body(err);
        }

        Optional<Faculty> facOpt = facultyRepository.findByEmail(cleanEmail);
        if ("parent".equalsIgnoreCase(userRequest.getRole())) {
            userRequest.setRole("parent");
            userRequest.setRoleTitle("Parent / Guardian");
            if (userRequest.getName() == null || userRequest.getName().isEmpty()) {
                userRequest.setName("Parent");
            }
        } else if (facOpt.isPresent()) {
            Faculty fac = facOpt.get();
            String rank = fac.getRankTitle() != null ? fac.getRankTitle().toLowerCase() : "";
            if (rank.contains("hod") || rank.contains("head")) {
                userRequest.setRole("hod");
                userRequest.setRoleTitle("Head of Department (HOD CSE)");
            } else {
                userRequest.setRole("faculty");
                userRequest.setRoleTitle(fac.getRankTitle());
            }
            userRequest.setName(fac.getName());
        } else if (studentRepository.existsByEmail(cleanEmail)) {
            userRequest.setRole("student");
            userRequest.setRoleTitle("B.Tech Student");
        } else {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Registration denied: Your email is not present in any pre-approved department database (Faculty or Student). For Parents, please select the Parent tab.");
            return ResponseEntity.badRequest().body(err);
        }

        userRequest.setEmail(cleanEmail);
        userRequest.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        
        if (userRequest.getDepartment() == null || userRequest.getDepartment().isEmpty()) {
            userRequest.setDepartment("Computer Science & Engineering");
        }
        
        User savedUser = userRepository.save(userRequest);

        if ("parent".equalsIgnoreCase(savedUser.getRole())) {
            // Auto link with existing student record matching parentEmail if present
            studentRepository.findByParentEmail(cleanEmail).ifPresent(student -> {
                Parent p = parentRepository.findByUserId(savedUser.getId())
                        .orElse(Parent.builder().userId(savedUser.getId()).build());
                p.setUserId(savedUser.getId());
                p.setStudentRollNo(student.getRollNo() != null ? student.getRollNo() : student.getPrn());
                p.setStudentName(student.getName());
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
        Optional<com.sit.portal.entity.Student> parentStudentOpt = studentRepository.findByParentEmail(cleanEmail);
        if (parentStudentOpt.isPresent()) {
            com.sit.portal.entity.Student st = parentStudentOpt.get();
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

        // 5. If NOT found in any database records, STRICTLY DENY LOGIN
        Map<String, String> err = new HashMap<>();
        err.put("status", "403");
        err.put("error", "ROSTER_NOT_FOUND");
        err.put("message", "Access Denied: The Google account (" + cleanEmail + ") is not registered in the official Sharad Institute of Technology (SITCOE) & Trust Institutions roster. Only enrolled students, faculty, and verified guardians are permitted to log in.");
        return ResponseEntity.status(403).body(err);
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
