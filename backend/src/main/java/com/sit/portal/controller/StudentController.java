package com.sit.portal.controller;

import com.sit.portal.entity.Student;
import com.sit.portal.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/students")
public class StudentController {

    @Autowired
    private StudentService studentService;

    @GetMapping
    public List<Student> getAllStudents() {
        return studentService.getAllStudents();
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
    public ResponseEntity<Student> getStudentById(@PathVariable String id) {
        return studentService.getStudentByIdOrRollNo(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Student> addStudent(@RequestBody Student student) {
        return ResponseEntity.status(201).body(studentService.addStudent(student));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Student>> addStudentsBulk(@RequestBody List<Student> students) {
        return ResponseEntity.status(201).body(studentService.addStudentsBulk(students));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable String id, @RequestBody Student student) {
        return studentService.updateStudent(id, student)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        if (!studentService.deleteStudent(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
