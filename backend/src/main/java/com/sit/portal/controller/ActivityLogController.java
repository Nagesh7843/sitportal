package com.sit.portal.controller;

import com.sit.portal.entity.ActivityLog;
import com.sit.portal.repository.ActivityLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/activities")
public class ActivityLogController {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @GetMapping
    public List<ActivityLog> getAllActivities() {
        return activityLogRepository.findTop20ByOrderByIdDesc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityLog> getActivityById(@PathVariable Long id) {
        return activityLogRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ActivityLog> createActivity(@RequestBody ActivityLog activityLog) {
        ActivityLog savedActivity = activityLogRepository.save(activityLog);
        return ResponseEntity.status(201).body(savedActivity);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivity(@PathVariable Long id) {
        if (!activityLogRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        activityLogRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearAllActivities() {
        activityLogRepository.deleteAll();
        return ResponseEntity.noContent().build();
    }
}
