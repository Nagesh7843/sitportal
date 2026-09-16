package com.sit.portal.controller;

import com.sit.portal.entity.*;
import com.sit.portal.repository.*;
import com.sit.portal.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/parents")
@CrossOrigin(origins = "*")
public class ParentController {

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NoticeRepository noticeRepository;

    @Autowired
    private ParentStudentRelationshipRepository parentStudentRelationshipRepository;

    @Autowired
    private StudentService studentService;

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

        Student linkedStudent = null;

        if (parentOpt.isPresent()) {
            Parent parent = parentOpt.get();
            result.put("parentInfo", parent);

            if (parent.getStudentRollNo() != null && !parent.getStudentRollNo().isEmpty()) {
                linkedStudent = studentRepository.findByRollNo(parent.getStudentRollNo())
                        .or(() -> studentRepository.findByPrn(parent.getStudentRollNo()))
                        .orElse(null);
            }
        }

        List<Student> studentsByEmail = studentRepository.findByParentEmail(email);
        result.put("linkedStudents", studentsByEmail);

        if (linkedStudent == null && !studentsByEmail.isEmpty()) {
            linkedStudent = studentsByEmail.get(0);
            Parent parent = parentOpt.orElse(Parent.builder().userId(user.getId()).build());
            parent.setUserId(user.getId());
            parent.setStudentRollNo(linkedStudent.getRollNo() != null ? linkedStudent.getRollNo() : linkedStudent.getPrn());
            parent.setStudentName(linkedStudent.getName());
            if (linkedStudent.getParentRelationship() != null) parent.setRelationship(linkedStudent.getParentRelationship());
            if (linkedStudent.getParentPhone() != null) parent.setAlternatePhone(linkedStudent.getParentPhone());
            Parent saved = parentRepository.save(parent);
            result.put("parentInfo", saved);
        }

        if (linkedStudent != null) {
            result.put("linkedStudent", linkedStudent);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/me/relationships")
    public ResponseEntity<?> getParentRelationships(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        String email = authentication.getName().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }
        Optional<Parent> parentOpt = parentRepository.findByUserId(userOpt.get().getId());
        if (parentOpt.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyList());
        }
        List<ParentStudentRelationship> rels = parentStudentRelationshipRepository.findByParentIdAndStatus(parentOpt.get().getId(), "VERIFIED");
        return ResponseEntity.ok(rels);
    }

    @GetMapping("/me/students/{prn}")
    public ResponseEntity<?> getVerifiedWardData(@PathVariable String prn, Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        String email = authentication.getName().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        }

        Optional<Student> studentOpt = studentRepository.findByPrn(prn);
        if (studentOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Student student = studentOpt.get();

        // Verify relationship
        boolean isAuthorized = false;
        if (email.equalsIgnoreCase(student.getParentEmail())) {
            isAuthorized = true;
        } else {
            Optional<Parent> parentOpt = parentRepository.findByUserId(userOpt.get().getId());
            if (parentOpt.isPresent()) {
                if (prn.equalsIgnoreCase(parentOpt.get().getStudentRollNo())) {
                    isAuthorized = true;
                } else {
                    Optional<ParentStudentRelationship> rel = parentStudentRelationshipRepository.findByParentIdAndPrn(parentOpt.get().getId(), prn);
                    if (rel.isPresent() && "VERIFIED".equalsIgnoreCase(rel.get().getStatus())) {
                        isAuthorized = true;
                    }
                }
            }
        }

        if (!isAuthorized) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied: You are not authorized to view information for PRN " + prn));
        }

        Map<String, Object> wardData = new HashMap<>();
        wardData.put("student", student);
        wardData.put("academicData", studentService.getAcademicDataByPrn(prn).orElse(null));
        wardData.put("currentEnrollment", studentService.getCurrentEnrollment(prn).orElse(null));
        wardData.put("enrollmentHistory", studentService.getEnrollmentHistory(prn));

        return ResponseEntity.ok(wardData);
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
            return ResponseEntity.badRequest().body(Map.of("message", "Student Roll No or PRN is required."));
        }

        String cleanRoll = studentRollNo.trim().toUpperCase();
        Optional<Student> studentOpt = studentRepository.findByRollNo(cleanRoll);
        if (studentOpt.isEmpty()) {
            studentOpt = studentRepository.findByPrn(cleanRoll);
        }
        if (studentOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("message", "Student with Roll No or PRN " + cleanRoll + " not found in department records."));
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
            Optional<Parent> existingParentOpt = parentRepository.findByUserId(userId);
            if (existingParentOpt.isPresent()) {
                Parent existing = existingParentOpt.get();
                if (existing.getStudentRollNo() != null && !existing.getStudentRollNo().isEmpty()) {
                    String targetIdentifier = student.getRollNo() != null ? student.getRollNo() : student.getPrn();
                    if (!existing.getStudentRollNo().equalsIgnoreCase(targetIdentifier) && !existing.getStudentRollNo().equalsIgnoreCase(student.getRollNo()) && !existing.getStudentRollNo().equalsIgnoreCase(student.getPrn())) {
                        return ResponseEntity.status(403).body(Map.of("message", "Parent account is already linked to a verified student (" + existing.getStudentName() + "). Contact the department office to request student re-association."));
                    }
                }
                parent = existing;
            } else {
                parent = Parent.builder().userId(userId).build();
            }
        } else {
            parent = parentRepository.findByStudentRollNo(cleanRoll).orElse(new Parent());
        }

        parent.setStudentRollNo(student.getRollNo() != null ? student.getRollNo() : student.getPrn());
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
        List<Notice> allNotices = noticeRepository.findAllPrioritizedAndLatest();
        return ResponseEntity.ok(allNotices);
    }

    @GetMapping
    public List<Parent> getAllParents() {
        return parentRepository.findAll();
    }
}
