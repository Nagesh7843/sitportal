package com.sit.portal.controller;

import com.sit.portal.config.JwtUtils;
import com.sit.portal.entity.User;
import com.sit.portal.repository.UserRepository;
import com.sit.portal.repository.StudentRepository;
import com.sit.portal.repository.FacultyRepository;
import com.sit.portal.entity.Faculty;
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
            // Validate password
            if (!passwordEncoder.matches(password, user.getPassword()) && !password.equals(user.getPassword())) {
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
        if (email == null) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Email is required.");
            return ResponseEntity.badRequest().body(err);
        }

        String cleanEmail = email.trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(cleanEmail);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String token = jwtUtils.generateToken(user.getEmail(), user.getRole());
            
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("user", user);
            response.put("role", user.getRole());
            response.put("message", "Authentication successful.");
            return ResponseEntity.ok(response);
        } else {
            Map<String, String> err = new HashMap<>();
            err.put("message", "No account found for this Google email. Please sign up first.");
            return ResponseEntity.status(401).body(err);
        }
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
