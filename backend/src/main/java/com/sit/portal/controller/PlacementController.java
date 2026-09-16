package com.sit.portal.controller;

import com.sit.portal.entity.*;
import com.sit.portal.repository.PlacementEligibilityRuleRepository;
import com.sit.portal.service.PlacementEligibilityEngine;
import com.sit.portal.service.PlacementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/placements")
@CrossOrigin(origins = "*")
public class PlacementController {

    @Autowired
    private PlacementService placementService;

    @Autowired
    private PlacementEligibilityEngine eligibilityEngine;

    @Autowired
    private PlacementEligibilityRuleRepository ruleRepository;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getPlacementSummary() {
        return ResponseEntity.ok(placementService.getPlacementSummary());
    }

    @PutMapping("/stats")
    public ResponseEntity<PlacementStat> updateStats(@RequestBody PlacementStat stat) {
        return ResponseEntity.ok(placementService.updateStats(stat));
    }

    @PostMapping("/recruiters")
    public ResponseEntity<PlacementRecruiter> addRecruiter(@RequestBody PlacementRecruiter recruiter) {
        return ResponseEntity.status(201).body(placementService.addRecruiter(recruiter));
    }

    @PutMapping("/recruiters/{id}")
    public ResponseEntity<PlacementRecruiter> updateRecruiter(@PathVariable Long id, @RequestBody PlacementRecruiter updated) {
        return placementService.updateRecruiter(id, updated)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/recruiters/{id}")
    public ResponseEntity<Map<String, Object>> deleteRecruiter(@PathVariable Long id) {
        placementService.deleteRecruiter(id);
        return ResponseEntity.ok(Map.of("message", "Recruiter deleted successfully", "id", id));
    }

    @PostMapping("/drives")
    public ResponseEntity<PlacementDrive> addDrive(@RequestBody PlacementDrive drive) {
        return ResponseEntity.status(201).body(placementService.addDrive(drive));
    }

    @PutMapping("/drives/{id}")
    public ResponseEntity<PlacementDrive> updateDrive(@PathVariable Long id, @RequestBody PlacementDrive updated) {
        return placementService.updateDrive(id, updated)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/drives/{id}")
    public ResponseEntity<Map<String, Object>> deleteDrive(@PathVariable Long id) {
        placementService.deleteDrive(id);
        return ResponseEntity.ok(Map.of("message", "Placement drive deleted successfully", "id", id));
    }

    @GetMapping("/achievers")
    public ResponseEntity<List<PlacedStudentAchievement>> getPlacedAchievers() {
        return ResponseEntity.ok(placementService.getPlacedAchievers());
    }

    @PostMapping("/achievers")
    public ResponseEntity<PlacedStudentAchievement> addPlacedAchiever(@RequestBody PlacedStudentAchievement achiever) {
        return ResponseEntity.status(201).body(placementService.addPlacedAchiever(achiever));
    }

    @PutMapping("/achievers/{id}")
    public ResponseEntity<PlacedStudentAchievement> updatePlacedAchiever(@PathVariable Long id, @RequestBody PlacedStudentAchievement updated) {
        return placementService.updatePlacedAchiever(id, updated)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/achievers/{id}")
    public ResponseEntity<Map<String, Object>> deletePlacedAchiever(@PathVariable Long id) {
        placementService.deletePlacedAchiever(id);
        return ResponseEntity.ok(Map.of("message", "Placed student removed successfully", "id", id));
    }

    @PostMapping("/generate-notice")
    public ResponseEntity<Map<String, Object>> generatePlacementNotice(@RequestBody Map<String, Object> req) {
        return ResponseEntity.ok(placementService.generatePlacementNotice(req));
    }

    @DeleteMapping("/reset")
    public ResponseEntity<Map<String, String>> resetPlacementData() {
        placementService.resetPlacementData();
        return ResponseEntity.ok(Map.of("message", "All placement metrics, recruiters, drives, and student achievers have been reset."));
    }

    // --- Placement Eligibility Engine Endpoints ---
    @PostMapping("/drives/{id}/evaluate")
    public ResponseEntity<List<PlacementEligibilityResult>> evaluateEligibility(
            @PathVariable Long id,
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(eligibilityEngine.evaluateDriveEligibility(id, userId));
    }

    @GetMapping("/drives/{id}/eligible-students")
    public ResponseEntity<List<PlacementEligibilityResult>> getEligibleStudents(@PathVariable Long id) {
        return ResponseEntity.ok(eligibilityEngine.getEligibleStudents(id));
    }

    @GetMapping("/drives/{id}/all-results")
    public ResponseEntity<List<PlacementEligibilityResult>> getAllEvaluationResults(@PathVariable Long id) {
        return ResponseEntity.ok(eligibilityEngine.getAllEvaluationResults(id));
    }

    @GetMapping("/drives/{id}/evaluation-details")
    public ResponseEntity<List<Map<String, Object>>> getEvaluationDetails(@PathVariable Long id) {
        return ResponseEntity.ok(eligibilityEngine.getDetailedEvaluationResults(id));
    }

    @GetMapping("/drives/{id}/eligibility-rule")
    public ResponseEntity<PlacementEligibilityRule> getEligibilityRule(@PathVariable Long id) {
        return ruleRepository.findByPlacementDriveId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/drives/{id}/eligibility-rule")
    public ResponseEntity<PlacementEligibilityRule> saveEligibilityRule(
            @PathVariable Long id,
            @RequestBody PlacementEligibilityRule rule) {
        rule.setPlacementDriveId(id);
        return ResponseEntity.ok(eligibilityEngine.saveOrUpdateRule(rule));
    }

    @PostMapping("/eligibility/evaluate-preview")
    public ResponseEntity<Map<String, Object>> evaluatePreview(@RequestBody PlacementEligibilityRule rule) {
        return ResponseEntity.ok(eligibilityEngine.evaluatePreview(rule));
    }

    @PostMapping("/drives/{id}/publish-targeted-notification")
    public ResponseEntity<Map<String, Object>> publishTargetedNotification(
            @PathVariable Long id,
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(eligibilityEngine.publishTargetedDriveNotification(id, userId));
    }
}
