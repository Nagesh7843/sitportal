package com.sit.portal.controller;

import com.sit.portal.entity.Student;
import com.sit.portal.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/students")
public class StudentController {

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Student> addStudent(@RequestBody Student student) {
        Student savedStudent = studentRepository.save(student);
        return ResponseEntity.ok(savedStudent);
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Student>> addStudentsBulk(@RequestBody List<Student> students) {
        List<Student> savedStudents = studentRepository.saveAll(students);
        return ResponseEntity.ok(savedStudents);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        studentRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
