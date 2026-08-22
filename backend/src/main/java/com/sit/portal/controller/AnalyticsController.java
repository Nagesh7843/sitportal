package com.sit.portal.controller;

import com.sit.portal.entity.Notice;
import com.sit.portal.entity.Student;
import com.sit.portal.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private NoticeRepository noticeRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private EmailLogRepository emailLogRepository;

    @Autowired
    private PushSubscriptionRepository pushSubscriptionRepository;

    @Autowired
    private CalendarEventRepository calendarEventRepository;

    @Autowired
    private CollegeNewsEventRepository collegeNewsEventRepository;

    @Autowired
    private PlacementDriveRepository placementDriveRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getAnalyticsStats() {
        return getSystemOverview();
    }

    @GetMapping("/system-overview")
    public ResponseEntity<?> getSystemOverview() {
        List<Notice> allNotices = noticeRepository.findAll();
        List<Student> allStudents = studentRepository.findAll();

        long totalNotices = allNotices.size();
        long totalStudents = allStudents.size();
        long totalFaculty = facultyRepository.count();
        long totalPushSubs = pushSubscriptionRepository.count();
        long totalMilestones = calendarEventRepository.count();
        long totalNewsEvents = collegeNewsEventRepository.count();
        long totalPlacementDrives = placementDriveRepository.count();

        // 1. Calculate Real Notice Views & Reads from PostgreSQL
        int totalViews = 0;
        int totalUniqueReads = 0;
        Map<String, Integer> catCounts = new HashMap<>();
        catCounts.put("exam", 0);
        catCounts.put("academic", 0);
        catCounts.put("events", 0);
        catCounts.put("urgent", 0);
        catCounts.put("placement", 0);
        catCounts.put("administrative", 0);

        for (Notice n : allNotices) {
            int views = (n.getViewsCount() != null) ? n.getViewsCount() : 0;
            int reads = (n.getReadBy() != null) ? n.getReadBy().size() : 0;
            totalViews += views;
            totalUniqueReads += reads;

            String cat = (n.getCategory() != null) ? n.getCategory().toLowerCase() : "academic";
            if (cat.contains("exam")) catCounts.put("exam", catCounts.get("exam") + 1);
            else if (cat.contains("event")) catCounts.put("events", catCounts.get("events") + 1);
            else if (cat.contains("emergency") || (n.getPriority() != null && n.getPriority().equalsIgnoreCase("URGENT"))) catCounts.put("urgent", catCounts.get("urgent") + 1);
            else if (cat.contains("placement") || cat.contains("drive") || cat.contains("job")) catCounts.put("placement", catCounts.get("placement") + 1);
            else if (cat.contains("admin")) catCounts.put("administrative", catCounts.get("administrative") + 1);
            else catCounts.put("academic", catCounts.get("academic") + 1);
        }

        // 2. Average Read Rate Calculation
        double avgReadRate = 0.0;
        if (totalNotices > 0 && totalStudents > 0) {
            double potentialReads = totalNotices * totalStudents;
            avgReadRate = Math.min(100.0, (totalUniqueReads > 0 ? (totalUniqueReads / potentialReads) * 100 : (totalViews / potentialReads) * 100));
        }

        // 3. Real Cohort Breakdown (FE, SE, TE, BE)
        Map<String, Long> studentsByYear = new HashMap<>();
        studentsByYear.put("FE", 0L);
        studentsByYear.put("SE", 0L);
        studentsByYear.put("TE", 0L);
        studentsByYear.put("BE", 0L);

        for (Student s : allStudents) {
            String yr = s.getAcademicYear() != null ? s.getAcademicYear().toUpperCase() : "";
            if (yr.contains("FE") || yr.contains("FIRST")) studentsByYear.put("FE", studentsByYear.get("FE") + 1);
            else if (yr.contains("SE") || yr.contains("SECOND") || yr.contains("S.Y")) studentsByYear.put("SE", studentsByYear.get("SE") + 1);
            else if (yr.contains("TE") || yr.contains("THIRD") || yr.contains("T.Y")) studentsByYear.put("TE", studentsByYear.get("TE") + 1);
            else if (yr.contains("BE") || yr.contains("FINAL") || yr.contains("B.TECH")) studentsByYear.put("BE", studentsByYear.get("BE") + 1);
        }

        List<Map<String, Object>> cohortBreakdown = new ArrayList<>();
        String[] yearsOrder = {"TE", "SE", "BE", "FE"};
        for (String yr : yearsOrder) {
            long count = studentsByYear.getOrDefault(yr, 0L);
            Map<String, Object> cMap = new HashMap<>();
            cMap.put("year", yr);
            cMap.put("label", yr.equals("TE") ? "Third Year (TE CSE)" : yr.equals("SE") ? "Second Year (SE CSE)" : yr.equals("BE") ? "Final Year (BE CSE)" : "First Year (FE CSE)");
            cMap.put("students", count);

            double cohortRate = (count > 0 && totalNotices > 0) ? Math.min(100.0, ((totalViews * 1.0) / (totalNotices * count)) * 100) : 0.0;
            cMap.put("rate", String.format(Locale.US, "%.1f", cohortRate));
            cMap.put("readsCount", (long) Math.floor(count * (cohortRate / 100.0)));
            cohortBreakdown.add(cMap);
        }

        // 4. Push & Email Deliveries
        long totalEmailRecipients = 0;
        try {
            totalEmailRecipients = emailLogRepository.findAll().stream()
                    .mapToLong(e -> e.getRecipientCount() != null ? e.getRecipientCount() : 1)
                    .sum();
        } catch (Exception ignored) {}
        long totalPushDeliveries = totalEmailRecipients + totalPushSubs + (totalViews > 0 ? totalViews : 0);

        Map<String, Object> response = new HashMap<>();
        response.put("totalPublishedNotices", totalNotices);
        response.put("totalNoticeViews", totalViews);
        response.put("totalUniqueReads", totalUniqueReads);
        response.put("avgReadRate", String.format(Locale.US, "%.1f", avgReadRate));
        response.put("fcmPushDeliveries", totalPushDeliveries);
        response.put("activePushSubscriptions", totalPushSubs);
        response.put("activeStudentsCount", totalStudents);
        response.put("totalFaculty", totalFaculty);
        response.put("totalCalendarMilestones", totalMilestones);
        response.put("totalActiveNewsEvents", totalNewsEvents);
        response.put("totalPlacementDrives", totalPlacementDrives);
        response.put("categoryCounts", catCounts);
        response.put("cohortBreakdown", cohortBreakdown);
        response.put("recentActivities", activityLogRepository.findTop20ByOrderByIdDesc());

        return ResponseEntity.ok(response);
    }
}
