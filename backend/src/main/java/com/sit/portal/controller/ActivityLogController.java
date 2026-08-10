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

    @PostMapping
    public ResponseEntity<ActivityLog> createActivity(@RequestBody ActivityLog activityLog) {
        ActivityLog savedActivity = activityLogRepository.save(activityLog);
        return ResponseEntity.ok(savedActivity);
    }
}
