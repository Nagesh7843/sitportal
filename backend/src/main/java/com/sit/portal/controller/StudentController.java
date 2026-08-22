package com.sit.portal.controller;

import com.sit.portal.entity.Parent;
import com.sit.portal.entity.Student;
import com.sit.portal.entity.User;
import com.sit.portal.repository.ParentRepository;
import com.sit.portal.repository.StudentRepository;
import com.sit.portal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/students")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ParentRepository parentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    @GetMapping("/me")
    public ResponseEntity<Student> getCurrentStudent(
            @RequestParam(required = false) String email,
            org.springframework.security.core.Authentication authentication
    ) {
        String lookupEmail = email;
        if ((lookupEmail == null || lookupEmail.trim().isEmpty()) && authentication != null) {
            lookupEmail = authentication.getName();
        }

        if (lookupEmail == null || lookupEmail.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String target = lookupEmail.trim().toLowerCase();
        Optional<Student> studentOpt = studentRepository.findAll().stream()
                .filter(s -> s.getEmail() != null && s.getEmail().equalsIgnoreCase(target))
                .findFirst();

        return studentOpt.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable String id) {
        try {
            Long numericId = Long.parseLong(id);
            return studentRepository.findById(numericId)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> studentRepository.findByRollNo(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()));
        } catch (NumberFormatException e) {
            return studentRepository.findByRollNo(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }
    }

    @PostMapping
    public ResponseEntity<Student> addStudent(@RequestBody Student student) {
        Student savedStudent = studentRepository.save(student);
        syncParentAccount(savedStudent);
        return ResponseEntity.status(201).body(savedStudent);
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Student>> addStudentsBulk(@RequestBody List<Student> students) {
        List<Student> savedStudents = studentRepository.saveAll(students);
        for (Student st : savedStudents) {
            syncParentAccount(st);
        }
        return ResponseEntity.status(201).body(savedStudents);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable String id, @RequestBody Student student) {
        Optional<Student> existingOpt;
        try {
            Long numericId = Long.parseLong(id);
            existingOpt = studentRepository.findById(numericId);
            if (existingOpt.isEmpty()) {
                existingOpt = studentRepository.findByRollNo(id);
            }
        } catch (NumberFormatException e) {
            existingOpt = studentRepository.findByRollNo(id);
        }

        if (existingOpt.isEmpty() && student.getRollNo() != null) {
            existingOpt = studentRepository.findByRollNo(student.getRollNo());
        }

        return existingOpt.map(existing -> {
            if (student.getName() != null) existing.setName(student.getName());
            if (student.getRollNo() != null) existing.setRollNo(student.getRollNo());
            if (student.getAcademicYear() != null) existing.setAcademicYear(student.getAcademicYear());
            if (student.getDivision() != null) existing.setDivision(student.getDivision());
            if (student.getBatchGroup() != null) existing.setBatchGroup(student.getBatchGroup());
            if (student.getCohortBatch() != null) existing.setCohortBatch(student.getCohortBatch());
            if (student.getPrn() != null) existing.setPrn(student.getPrn());
            existing.setGpa(student.getGpa());
            if (student.getEmail() != null) existing.setEmail(student.getEmail());
            if (student.getAttendance() != null) existing.setAttendance(student.getAttendance());
            if (student.getParentName() != null) existing.setParentName(student.getParentName());
            if (student.getParentEmail() != null) existing.setParentEmail(student.getParentEmail());
            if (student.getParentPhone() != null) existing.setParentPhone(student.getParentPhone());
            if (student.getParentRelationship() != null) existing.setParentRelationship(student.getParentRelationship());
            if (student.getStatus() != null) existing.setStatus(student.getStatus());

            Student updated = studentRepository.save(existing);
            syncParentAccount(updated);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        if (!studentRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        studentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void syncParentAccount(Student student) {
        if (student.getParentEmail() == null || student.getParentEmail().trim().isEmpty()) {
            return;
        }

        String email = student.getParentEmail().trim().toLowerCase();
        String parentName = (student.getParentName() != null && !student.getParentName().trim().isEmpty())
                ? student.getParentName().trim()
                : "Parent of " + student.getName();

        // 1. Ensure user record exists for parent login
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .name(parentName)
                    .email(email)
                    .role("parent")
                    .roleTitle("Parent / Guardian")
                    .department("CSE")
                    .password(passwordEncoder.encode("Parent@123"))
                    .createdAt(LocalDateTime.now())
                    .build();
            return userRepository.save(newUser);
        });

        // 2. Ensure parent record linked to child's roll number exists
        Optional<Parent> parentOpt = parentRepository.findByStudentRollNo(student.getRollNo());
        Parent parent;
        if (parentOpt.isPresent()) {
            parent = parentOpt.get();
            parent.setUserId(user.getId());
            parent.setStudentName(student.getName());
            if (student.getParentPhone() != null) parent.setAlternatePhone(student.getParentPhone());
            if (student.getParentRelationship() != null) parent.setRelationship(student.getParentRelationship());
        } else {
            parent = Parent.builder()
                    .userId(user.getId())
                    .studentRollNo(student.getRollNo())
                    .studentName(student.getName())
                    .alternatePhone(student.getParentPhone())
                    .relationship(student.getParentRelationship() != null ? student.getParentRelationship() : "Parent/Guardian")
                    .occupation("Guardian")
                    .createdAt(LocalDateTime.now())
                    .build();
        }
        parentRepository.save(parent);
    }
}
