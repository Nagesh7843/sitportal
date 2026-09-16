package com.sit.portal.controller;

import com.sit.portal.entity.*;
import com.sit.portal.service.FacultyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/faculty")
@CrossOrigin(origins = "*")
public class FacultyController {

    @Autowired
    private FacultyService facultyService;

    @GetMapping
    public List<Faculty> getAllFaculty(@RequestParam(required = false) String department) {
        return facultyService.getAllFaculty(department);
    }

    @GetMapping("/me/batches")
    public ResponseEntity<List<Batch>> getMyAssignedBatches(
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

        return facultyService.getFacultyByEmail(lookupEmail)
                .map(faculty -> ResponseEntity.ok(facultyService.getAssignedBatches(faculty.getId())))
                .orElse(ResponseEntity.notFound().build());
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

    // --- Batch Assignment & Monitoring Endpoints ---
    @GetMapping("/{id}/batches")
    public ResponseEntity<List<Batch>> getFacultyBatches(@PathVariable Long id) {
        return ResponseEntity.ok(facultyService.getAssignedBatches(id));
    }

    @PostMapping("/{id}/batches/{batchId}")
    public ResponseEntity<FacultyBatchAssignment> assignBatch(
            @PathVariable Long id,
            @PathVariable Long batchId) {
        return ResponseEntity.status(201).body(facultyService.assignBatchToFaculty(id, batchId));
    }

    @DeleteMapping("/{id}/batches/{batchId}")
    public ResponseEntity<Void> removeBatch(
            @PathVariable Long id,
            @PathVariable Long batchId) {
        if (!facultyService.removeBatchAssignment(id, batchId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/batches/{batchId}/students")
    public ResponseEntity<List<Student>> getStudentsInBatch(@PathVariable Long batchId) {
        return ResponseEntity.ok(facultyService.getStudentsInBatch(batchId));
    }
}
