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

    @GetMapping("/{id}")
    public ResponseEntity<Faculty> getFacultyById(@PathVariable Long id) {
        return facultyRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Faculty> addFaculty(@RequestBody Faculty faculty) {
        Faculty savedFaculty = facultyRepository.save(faculty);
        return ResponseEntity.status(201).body(savedFaculty);
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Faculty>> addFacultyBulk(@RequestBody List<Faculty> facultyList) {
        List<Faculty> savedFacultyList = facultyRepository.saveAll(facultyList);
        return ResponseEntity.status(201).body(savedFacultyList);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Faculty> updateFaculty(@PathVariable Long id, @RequestBody Faculty faculty) {
        return facultyRepository.findById(id).map(existing -> {
            if (faculty.getName() != null) existing.setName(faculty.getName());
            if (faculty.getSpecialization() != null) existing.setSpecialization(faculty.getSpecialization());
            if (faculty.getRankTitle() != null) existing.setRankTitle(faculty.getRankTitle());
            if (faculty.getStatus() != null) existing.setStatus(faculty.getStatus());
            if (faculty.getEmail() != null) existing.setEmail(faculty.getEmail());
            if (faculty.getOfficeHours() != null) existing.setOfficeHours(faculty.getOfficeHours());
            if (faculty.getPublicationsCount() != null) existing.setPublicationsCount(faculty.getPublicationsCount());
            return ResponseEntity.ok(facultyRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
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
        if (!facultyRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        facultyRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
