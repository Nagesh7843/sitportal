package com.sit.portal.controller;

import com.sit.portal.entity.User;
import com.sit.portal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

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
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUserProfile(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "User is not authenticated.");
            return ResponseEntity.status(401).body(err);
        }

        String email = authentication.getName().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "User profile not found in database.");
            return ResponseEntity.status(404).body(err);
        }

        User user = userOpt.get();
        // Hide password in response
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(Authentication authentication, @RequestBody Map<String, Object> updates) {
        System.out.println("USER_CONTROLLER: Entered updateUserProfile");
        
        if (authentication == null || authentication.getName() == null) {
            System.out.println("USER_CONTROLLER: Auth is null");
            Map<String, String> err = new HashMap<>();
            err.put("message", "User is not authenticated.");
            return ResponseEntity.status(401).body(err);
        }

        String email = authentication.getName().trim().toLowerCase();
        System.out.println("USER_CONTROLLER: Email is " + email);
        
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            System.out.println("USER_CONTROLLER: User not found in DB");
            Map<String, String> err = new HashMap<>();
            err.put("message", "User profile not found in database.");
            return ResponseEntity.status(404).body(err);
        }

        User user = userOpt.get();

        if (updates.containsKey("name") && updates.get("name") != null) {
            user.setName((String) updates.get("name"));
        }
        if (updates.containsKey("phone")) {
            user.setPhone((String) updates.get("phone"));
        }
        if (updates.containsKey("avatar")) {
            user.setAvatar((String) updates.get("avatar"));
        }
        if (updates.containsKey("bio")) {
            user.setBio((String) updates.get("bio"));
        }
        if (updates.containsKey("officeLocation")) {
            user.setOfficeLocation((String) updates.get("officeLocation"));
        }
        if (updates.containsKey("qualification")) {
            user.setQualification((String) updates.get("qualification"));
        }
        if (updates.containsKey("roleTitle") && updates.get("roleTitle") != null) {
            user.setRoleTitle((String) updates.get("roleTitle"));
        }
        if (updates.containsKey("department") && updates.get("department") != null) {
            user.setDepartment((String) updates.get("department"));
        }

        System.out.println("USER_CONTROLLER: Saving user...");
        try {
            User savedUser = userRepository.save(user);
            System.out.println("USER_CONTROLLER: Saved successfully!");
            savedUser.setPassword(null);

            Map<String, Object> res = new HashMap<>();
            res.put("status", "success");
            res.put("message", "User profile updated successfully.");
            res.put("user", savedUser);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            System.out.println("USER_CONTROLLER: Save failed with exception: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> err = new HashMap<>();
            err.put("message", "Failed to update user profile due to server error: " + e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(Authentication authentication, @RequestBody Map<String, String> request) {
        if (authentication == null || authentication.getName() == null) {
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

        String email = authentication.getName().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "User not found.");
            return ResponseEntity.status(404).body(err);
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(currentPassword, user.getPassword()) && !currentPassword.equals(user.getPassword())) {
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
}
