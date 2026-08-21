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

    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable Long id) {
        return studentRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Student> addStudent(@RequestBody Student student) {
        Student savedStudent = studentRepository.save(student);
        return ResponseEntity.status(201).body(savedStudent);
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Student>> addStudentsBulk(@RequestBody List<Student> students) {
        List<Student> savedStudents = studentRepository.saveAll(students);
        return ResponseEntity.status(201).body(savedStudents);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Student> updateStudent(@PathVariable Long id, @RequestBody Student student) {
        return studentRepository.findById(id).map(existing -> {
            if (student.getName() != null) existing.setName(student.getName());
            if (student.getRollNo() != null) existing.setRollNo(student.getRollNo());
            if (student.getAcademicYear() != null) existing.setAcademicYear(student.getAcademicYear());
            if (student.getDivision() != null) existing.setDivision(student.getDivision());
            if (student.getBatchGroup() != null) existing.setBatchGroup(student.getBatchGroup());
            if (student.getCohortBatch() != null) existing.setCohortBatch(student.getCohortBatch());
            if (student.getPrn() != null) existing.setPrn(student.getPrn());
            if (student.getGpa() != null) existing.setGpa(student.getGpa());
            if (student.getEmail() != null) existing.setEmail(student.getEmail());
            if (student.getStatus() != null) existing.setStatus(student.getStatus());
            return ResponseEntity.ok(studentRepository.save(existing));
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
}
