package com.sit.portal.controller;

import com.sit.portal.entity.*;
import com.sit.portal.service.OrganizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.sit.portal.service.AcademicTransitionService;
import org.springframework.security.core.Authentication;

import java.util.Map;

@RestController
@RequestMapping({"/api/organization", "/api/v1/organization"})
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*")
public class OrganizationController {

    private final OrganizationService organizationService;
    private final AcademicTransitionService academicTransitionService;

    @GetMapping("/hierarchy-stats")
    public ResponseEntity<Map<String, Object>> getHierarchyStats() {
        return ResponseEntity.ok(organizationService.getHierarchyStats());
    }

    @GetMapping("/departments")
    public ResponseEntity<List<Department>> getDepartments() {
        return ResponseEntity.ok(organizationService.getAllDepartments());
    }

    @GetMapping("/departments/{code}")
    public ResponseEntity<Department> getDepartmentByCode(@PathVariable String code) {
        return organizationService.getDepartmentByCode(code)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/departments/{departmentId}/programs")
    public ResponseEntity<List<Program>> getPrograms(@PathVariable Long departmentId) {
        return ResponseEntity.ok(organizationService.getProgramsByDepartment(departmentId));
    }

    @GetMapping("/academic-years")
    public ResponseEntity<List<AcademicYear>> getAcademicYears() {
        return ResponseEntity.ok(organizationService.getAllAcademicYears());
    }

    @GetMapping("/academic-years/current")
    public ResponseEntity<AcademicYear> getCurrentAcademicYear() {
        return organizationService.getCurrentAcademicYear()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/departments/{departmentId}/divisions")
    public ResponseEntity<List<Division>> getDivisions(
            @PathVariable Long departmentId,
            @RequestParam(required = false) String yearLevel) {
        return ResponseEntity.ok(organizationService.getDivisionsByDepartment(departmentId, yearLevel));
    }

    @GetMapping("/divisions/{divisionId}/batches")
    public ResponseEntity<List<Batch>> getBatches(@PathVariable Long divisionId) {
        return ResponseEntity.ok(organizationService.getBatchesByDivision(divisionId));
    }

    // --- Academic Transition Engine ---
    @PostMapping("/academic-years/transition")
    public ResponseEntity<?> transitionStudent(
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {
        String prn = (String) payload.get("prn");
        Long newAcademicYearId = payload.get("academicYearId") != null ? Long.parseLong(payload.get("academicYearId").toString()) : 2L;
        Long newDepartmentId = payload.get("departmentId") != null ? Long.parseLong(payload.get("departmentId").toString()) : 1L;
        Long newProgramId = payload.get("programId") != null ? Long.parseLong(payload.get("programId").toString()) : 1L;
        String newYearLevel = (String) payload.getOrDefault("yearLevel", "SE");
        Long newSemesterId = payload.get("semesterId") != null ? Long.parseLong(payload.get("semesterId").toString()) : 3L;
        Long newDivisionId = payload.get("divisionId") != null ? Long.parseLong(payload.get("divisionId").toString()) : 1L;
        Long newBatchId = payload.get("batchId") != null ? Long.parseLong(payload.get("batchId").toString()) : 1L;
        Long actorId = 1L;

        if (prn == null || prn.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "PRN is required for academic transition."));
        }

        StudentEnrollment enrollment = academicTransitionService.transitionStudentToNextTerm(
                prn, newAcademicYearId, newDepartmentId, newProgramId, newYearLevel, newSemesterId, newDivisionId, newBatchId, actorId
        );
        return ResponseEntity.ok(enrollment);
    }

    @PostMapping("/academic-years/transition/cohort")
    public ResponseEntity<?> transitionCohort(
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {
        @SuppressWarnings("unchecked")
        List<String> prns = (List<String>) payload.get("prns");
        Long newAcademicYearId = payload.get("academicYearId") != null ? Long.parseLong(payload.get("academicYearId").toString()) : 2L;
        Long newDepartmentId = payload.get("departmentId") != null ? Long.parseLong(payload.get("departmentId").toString()) : 1L;
        Long newProgramId = payload.get("programId") != null ? Long.parseLong(payload.get("programId").toString()) : 1L;
        String newYearLevel = (String) payload.getOrDefault("yearLevel", "SE");
        Long newSemesterId = payload.get("semesterId") != null ? Long.parseLong(payload.get("semesterId").toString()) : 3L;
        Long newDivisionId = payload.get("divisionId") != null ? Long.parseLong(payload.get("divisionId").toString()) : 1L;
        Long newBatchId = payload.get("batchId") != null ? Long.parseLong(payload.get("batchId").toString()) : 1L;
        Long actorId = 1L;

        if (prns == null || prns.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "PRNs list cannot be empty for cohort transition."));
        }

        List<StudentEnrollment> enrollments = academicTransitionService.bulkTransitionCohort(
                prns, newAcademicYearId, newDepartmentId, newProgramId, newYearLevel, newSemesterId, newDivisionId, newBatchId, actorId
        );
        return ResponseEntity.ok(enrollments);
    }
}
