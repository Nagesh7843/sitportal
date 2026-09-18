package com.sit.portal.controller;

import com.sit.portal.dto.StudentAddressDto;
import com.sit.portal.entity.*;
import com.sit.portal.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/students")
@CrossOrigin(origins = "*")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @GetMapping
    public List<Student> getAllStudents(
            @RequestParam(required = false) String department,
            Authentication authentication
    ) {
        List<Student> list = studentService.getAllStudents(department);
        return list.stream()
                .map(s -> studentService.maskAddressIfUnauthorized(s, authentication))
                .toList();
    }

    @GetMapping("/me")
    public ResponseEntity<Student> getCurrentStudent(
            @RequestParam(required = false) String email,
            Authentication authentication
    ) {
        String lookupEmail = email;
        if ((lookupEmail == null || lookupEmail.trim().isEmpty()) && authentication != null) {
            lookupEmail = authentication.getName();
        }

        if (lookupEmail == null || lookupEmail.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        return studentService.getStudentByEmail(lookupEmail)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(
            @PathVariable String id,
            Authentication authentication
    ) {
        return studentService.getStudentByIdOrRollNo(id)
                .map(s -> studentService.maskAddressIfUnauthorized(s, authentication))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> addStudent(@RequestBody Student student) {
        try {
            return ResponseEntity.status(201).body(studentService.addStudent(student));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Student>> addStudentsBulk(@RequestBody List<Student> students) {
        return ResponseEntity.status(201).body(studentService.addStudentsBulk(students));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable String id, @RequestBody Student student) {
        try {
            return studentService.updateStudent(id, student)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PutMapping("/{id}/address")
    public ResponseEntity<?> updateStudentAddress(
            @PathVariable String id,
            @Valid @RequestBody StudentAddressDto addressDto,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Authentication required to update home address."));
        }
        String userEmail = authentication.getName();
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_STUDENT");
        try {
            return studentService.updateStudentAddress(id, addressDto, userEmail, role)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body(Map.of("message", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PutMapping("/me/address")
    public ResponseEntity<?> updateCurrentStudentAddress(
            @Valid @RequestBody StudentAddressDto addressDto,
            Authentication authentication
    ) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body(Map.of("message", "Authentication required to update home address."));
        }
        String userEmail = authentication.getName();
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .findFirst()
                .orElse("ROLE_STUDENT");
        try {
            return studentService.updateStudentAddress(userEmail, addressDto, userEmail, role)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (SecurityException ex) {
            return ResponseEntity.status(403).body(Map.of("message", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable String id) {
        if (!studentService.deleteStudent(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    // --- Enrollment History Endpoints ---
    @GetMapping("/{prn}/enrollments")
    public ResponseEntity<List<StudentEnrollment>> getStudentEnrollments(@PathVariable String prn) {
        return ResponseEntity.ok(studentService.getEnrollmentHistory(prn));
    }

    @PostMapping("/{prn}/enrollments")
    public ResponseEntity<StudentEnrollment> addEnrollment(
            @PathVariable String prn,
            @RequestBody StudentEnrollment enrollment) {
        enrollment.setPrn(prn);
        return ResponseEntity.status(201).body(studentService.enrollStudent(enrollment));
    }

    // --- Academic Data Endpoints (CGPA, 10th, 12th/Diploma) ---
    @GetMapping("/{prn}/academic-data")
    public ResponseEntity<StudentAcademicData> getAcademicData(@PathVariable String prn) {
        return studentService.getAcademicDataByPrn(prn)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{prn}/academic-data")
    public ResponseEntity<StudentAcademicData> saveAcademicData(
            @PathVariable String prn,
            @RequestBody StudentAcademicData data) {
        data.setPrn(prn);
        return ResponseEntity.ok(studentService.saveOrUpdateAcademicData(data));
    }

    // --- Self-Service Change Requests Endpoints ---
    @PostMapping("/{prn}/change-requests")
    public ResponseEntity<StudentChangeRequest> submitChangeRequest(
            @PathVariable String prn,
            @RequestBody StudentChangeRequest request) {
        request.setPrn(prn);
        return ResponseEntity.status(201).body(studentService.submitChangeRequest(request));
    }

    @GetMapping("/change-requests")
    public ResponseEntity<List<StudentChangeRequest>> getChangeRequests(
            @RequestParam(required = false) String prn,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(studentService.getChangeRequests(prn, status));
    }

    @PutMapping("/change-requests/{id}/verify")
    public ResponseEntity<StudentChangeRequest> verifyChangeRequest(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload) {
        String status = (String) payload.getOrDefault("status", "APPROVED");
        String comments = (String) payload.get("comments");
        Long verifierId = null;
        if (payload.get("verifiedByUserId") != null) {
            try {
                verifierId = Long.parseLong(payload.get("verifiedByUserId").toString());
            } catch (Exception ignored) {}
        }
        return studentService.verifyChangeRequest(id, status, verifierId, comments)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
