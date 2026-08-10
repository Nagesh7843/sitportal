package com.sit.portal.controller;

import com.sit.portal.entity.Faculty;
import com.sit.portal.repository.FacultyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/faculty")
public class FacultyController {

    @Autowired
    private FacultyRepository facultyRepository;

    @GetMapping
    public List<Faculty> getAllFaculty() {
        return facultyRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Faculty> addFaculty(@RequestBody Faculty faculty) {
        Faculty savedFaculty = facultyRepository.save(faculty);
        return ResponseEntity.ok(savedFaculty);
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Faculty>> addFacultyBulk(@RequestBody List<Faculty> facultyList) {
        List<Faculty> savedFacultyList = facultyRepository.saveAll(facultyList);
        return ResponseEntity.ok(savedFacultyList);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Faculty> updateFacultyStatus(@PathVariable Long id, @RequestParam String status) {
        Optional<Faculty> facOpt = facultyRepository.findById(id);
        if (facOpt.isPresent()) {
            Faculty faculty = facOpt.get();
            faculty.setStatus(status);
            Faculty updated = facultyRepository.save(faculty);
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFaculty(@PathVariable Long id) {
        facultyRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
