package com.sit.portal.controller;

import com.sit.portal.entity.PlacedStudentAchievement;
import com.sit.portal.entity.PlacementDrive;
import com.sit.portal.entity.PlacementRecruiter;
import com.sit.portal.entity.PlacementStat;
import com.sit.portal.service.PlacementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/placements")
public class PlacementController {

    @Autowired
    private PlacementService placementService;

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
}
