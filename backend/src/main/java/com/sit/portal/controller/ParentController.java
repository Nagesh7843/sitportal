package com.sit.portal.controller;

import com.sit.portal.entity.Notice;
import com.sit.portal.entity.Parent;
import com.sit.portal.entity.Student;
import com.sit.portal.entity.User;
import com.sit.portal.repository.NoticeRepository;
import com.sit.portal.repository.ParentRepository;
import com.sit.portal.repository.StudentRepository;
import com.sit.portal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/parents")
public class ParentController {

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NoticeRepository noticeRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getParentProfile(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }

        String email = authentication.getName().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        User user = userOpt.get();
        Optional<Parent> parentOpt = parentRepository.findByUserId(user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("user", user);

        if (parentOpt.isPresent()) {
            Parent parent = parentOpt.get();
            result.put("parentInfo", parent);

            if (parent.getStudentRollNo() != null && !parent.getStudentRollNo().isEmpty()) {
                Optional<Student> studentOpt = studentRepository.findByRollNo(parent.getStudentRollNo());
                studentOpt.ifPresent(student -> result.put("linkedStudent", student));
            }
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/link-student")
    public ResponseEntity<?> linkStudent(
            @RequestBody Map<String, String> request,
            Authentication authentication
    ) {
        String studentRollNo = request.get("studentRollNo");
        String relationship = request.getOrDefault("relationship", "Parent/Guardian");
        String alternatePhone = request.get("alternatePhone");
        String occupation = request.get("occupation");

        if (studentRollNo == null || studentRollNo.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Student Roll No is required."));
        }

        String cleanRoll = studentRollNo.trim().toUpperCase();
        Optional<Student> studentOpt = studentRepository.findByRollNo(cleanRoll);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Student with Roll No " + cleanRoll + " not found in department records."));
        }

        Student student = studentOpt.get();

        Long userId = null;
        if (authentication != null && authentication.getName() != null) {
            String email = authentication.getName().trim().toLowerCase();
            Optional<User> userOpt = userRepository.findByEmail(email);
            if (userOpt.isPresent()) {
                userId = userOpt.get().getId();
            }
        }

        Parent parent;
        if (userId != null) {
            parent = parentRepository.findByUserId(userId).orElse(Parent.builder().userId(userId).build());
        } else {
            parent = parentRepository.findByStudentRollNo(cleanRoll).orElse(new Parent());
        }

        parent.setStudentRollNo(cleanRoll);
        parent.setStudentName(student.getName());
        parent.setRelationship(relationship);
        if (alternatePhone != null) parent.setAlternatePhone(alternatePhone);
        if (occupation != null) parent.setOccupation(occupation);

        Parent savedParent = parentRepository.save(parent);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Student successfully linked to parent profile.");
        response.put("parent", savedParent);
        response.put("student", student);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/notices")
    public ResponseEntity<?> getParentNotices(Authentication authentication) {
        // Return all notices since parents receive all categories that students receive
        List<Notice> allNotices = noticeRepository.findAllPrioritizedAndLatest();
        return ResponseEntity.ok(allNotices);
    }

    @GetMapping
    public List<Parent> getAllParents() {
        return parentRepository.findAll();
    }
}
