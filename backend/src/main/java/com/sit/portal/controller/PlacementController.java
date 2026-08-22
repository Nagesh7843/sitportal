package com.sit.portal.controller;

import com.sit.portal.entity.PlacementDrive;
import com.sit.portal.entity.PlacementRecruiter;
import com.sit.portal.entity.PlacementStat;
import com.sit.portal.repository.PlacementDriveRepository;
import com.sit.portal.repository.PlacementRecruiterRepository;
import com.sit.portal.repository.PlacementStatRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/placements")
public class PlacementController {

    @Autowired
    private PlacementStatRepository statRepository;

    @Autowired
    private PlacementRecruiterRepository recruiterRepository;

    @Autowired
    private PlacementDriveRepository driveRepository;

    @Autowired
    private com.sit.portal.service.PushNotificationService pushNotificationService;

    @Autowired
    private com.sit.portal.repository.ActivityLogRepository activityLogRepository;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getPlacementSummary() {
        Map<String, Object> response = new HashMap<>();

        List<PlacementStat> statsList = statRepository.findAll();
        PlacementStat stats = statsList.isEmpty() ? null : statsList.get(0);

        List<PlacementRecruiter> recruiters = recruiterRepository.findAllByOrderByIdAsc();
        List<PlacementDrive> drives = driveRepository.findAllByOrderByIdDesc();

        response.put("stats", stats);
        response.put("recruiters", recruiters);
        response.put("drives", drives);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/stats")
    public ResponseEntity<PlacementStat> updateStats(@RequestBody PlacementStat stat) {
        List<PlacementStat> statsList = statRepository.findAll();
        PlacementStat target;
        if (statsList.isEmpty()) {
            target = stat;
        } else {
            target = statsList.get(0);
            if (stat.getHighestPackage() != null) target.setHighestPackage(stat.getHighestPackage());
            if (stat.getAveragePackage() != null) target.setAveragePackage(stat.getAveragePackage());
            if (stat.getPlacementRatio() != null) target.setPlacementRatio(stat.getPlacementRatio());
            if (stat.getTotalOffers() != null) target.setTotalOffers(stat.getTotalOffers());
            if (stat.getBatchYear() != null) target.setBatchYear(stat.getBatchYear());
        }
        PlacementStat saved = statRepository.save(target);

        // Dispatch desktop notification for placement milestone
        if (saved.getHighestPackage() != null || saved.getTotalOffers() != null) {
            String title = "💼 Placement Milestone: " + (saved.getBatchYear() != null ? "Batch " + saved.getBatchYear() : "CSE Department");
            String msg = "Highest CTC: " + (saved.getHighestPackage() != null ? saved.getHighestPackage() : "-")
                    + " • Placement Ratio: " + (saved.getPlacementRatio() != null ? saved.getPlacementRatio() : "-");
            pushNotificationService.sendPushNotificationToAll(title, msg);
        }

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/recruiters")
    public ResponseEntity<PlacementRecruiter> addRecruiter(@RequestBody PlacementRecruiter recruiter) {
        PlacementRecruiter savedRecruiter = recruiterRepository.save(recruiter);

        // Dispatch desktop notification for new recruiting partner
        String pushTitle = "🏢 New Recruiting Partner: " + savedRecruiter.getName();
        String pushMsg = "Package Band: " + (savedRecruiter.getPackageBand() != null ? savedRecruiter.getPackageBand() : "Competitive")
                + " • Domain: " + (savedRecruiter.getRoleTag() != null ? savedRecruiter.getRoleTag() : "Software Development");

        pushNotificationService.sendPushNotificationToAll(pushTitle, pushMsg);

        activityLogRepository.save(com.sit.portal.entity.ActivityLog.builder()
                .title("New Recruiting Partner: " + savedRecruiter.getName())
                .subtitle(savedRecruiter.getPackageBand() + " • " + (savedRecruiter.getRoleTag() != null ? savedRecruiter.getRoleTag() : ""))
                .timeAgo("Just now")
                .icon("domain")
                .colorBg("bg-blue-50")
                .colorIcon("text-blue-700")
                .type("PLACEMENT")
                .createdAt(java.time.LocalDateTime.now())
                .build());

        return ResponseEntity.status(201).body(savedRecruiter);
    }

    @DeleteMapping("/recruiters/{id}")
    public ResponseEntity<Map<String, Object>> deleteRecruiter(@PathVariable Long id) {
        recruiterRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Recruiter deleted successfully", "id", id));
    }

    @PostMapping("/drives")
    public ResponseEntity<PlacementDrive> addDrive(@RequestBody PlacementDrive drive) {
        PlacementDrive savedDrive = driveRepository.save(drive);

        // Dispatch Chrome desktop Web Push notification to all subscribers
        String pushTitle = "💼 New Placement Drive: " + savedDrive.getCompanyName();
        String pushMsg = "Role: " + savedDrive.getRole()
                + (savedDrive.getPackageLpa() != null ? " (" + savedDrive.getPackageLpa() + ")" : "")
                + " • Date: " + (savedDrive.getDriveDate() != null ? savedDrive.getDriveDate() : "TBA");

        pushNotificationService.sendPushNotificationToAll(pushTitle, pushMsg);

        // Record in activity log
        activityLogRepository.save(com.sit.portal.entity.ActivityLog.builder()
                .title("New Placement Drive: " + savedDrive.getCompanyName())
                .subtitle(savedDrive.getRole() + " • " + (savedDrive.getPackageLpa() != null ? savedDrive.getPackageLpa() : ""))
                .timeAgo("Just now")
                .icon("work")
                .colorBg("bg-emerald-50")
                .colorIcon("text-emerald-700")
                .type("PLACEMENT")
                .createdAt(java.time.LocalDateTime.now())
                .build());

        return ResponseEntity.status(201).body(savedDrive);
    }

    @DeleteMapping("/drives/{id}")
    public ResponseEntity<Map<String, Object>> deleteDrive(@PathVariable Long id) {
        driveRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Placement drive deleted successfully", "id", id));
    }

    @DeleteMapping("/reset")
    public ResponseEntity<Map<String, Object>> resetAll() {
        statRepository.deleteAll();
        recruiterRepository.deleteAll();
        driveRepository.deleteAll();
        return ResponseEntity.ok(Map.of("message", "All placement records cleared successfully"));
    }
}
