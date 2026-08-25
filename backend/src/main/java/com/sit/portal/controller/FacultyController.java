package com.sit.portal.controller;

import com.sit.portal.entity.Faculty;
import com.sit.portal.service.FacultyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty")
public class FacultyController {

    @Autowired
    private FacultyService facultyService;

    @GetMapping
    public List<Faculty> getAllFaculty() {
        return facultyService.getAllFaculty();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Faculty> getFacultyById(@PathVariable Long id) {
        return facultyService.getFacultyById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Faculty> addFaculty(@RequestBody Faculty faculty) {
        return ResponseEntity.status(201).body(facultyService.addFaculty(faculty));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Faculty>> addFacultyBulk(@RequestBody List<Faculty> facultyList) {
        return ResponseEntity.status(201).body(facultyService.addFacultyBulk(facultyList));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Faculty> updateFaculty(@PathVariable Long id, @RequestBody Faculty faculty) {
        return facultyService.updateFaculty(id, faculty)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Faculty> updateFacultyStatus(@PathVariable Long id, @RequestParam String status) {
        return facultyService.updateFacultyStatus(id, status)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFaculty(@PathVariable Long id) {
        if (!facultyService.deleteFaculty(id)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
