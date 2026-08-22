package com.sit.portal.controller;

import com.sit.portal.entity.AcademicCalendar;
import com.sit.portal.entity.CalendarEvent;
import com.sit.portal.repository.AcademicCalendarRepository;
import com.sit.portal.repository.CalendarEventRepository;
import com.sit.portal.service.AutomaticNoticeSchedulerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/scheduler")
public class SchedulerController {

    @Autowired
    private AutomaticNoticeSchedulerService automaticNoticeSchedulerService;

    @Autowired
    private AcademicCalendarRepository academicCalendarRepository;

    @Autowired
    private CalendarEventRepository calendarEventRepository;

    @PostMapping("/run-now")
    public ResponseEntity<?> triggerSchedulerManualRun() {
        Map<String, Object> report = automaticNoticeSchedulerService.runSchedulerJob();
        return ResponseEntity.ok(report);
    }

    @GetMapping("/status")
    public ResponseEntity<?> getSchedulerStatus() {
        Optional<AcademicCalendar> activeOpt = academicCalendarRepository.findByIsActiveTrue();
        Map<String, Object> status = new HashMap<>();

        if (activeOpt.isPresent()) {
            AcademicCalendar cal = activeOpt.get();
            List<CalendarEvent> events = calendarEventRepository.findByCalendarIdOrderByStartDateAsc(cal.getId());
            long pendingNotices = events.stream().filter(e -> "PENDING".equalsIgnoreCase(e.getNoticeStatus()) && Boolean.TRUE.equals(e.getIsNoticePlanned())).count();
            long generatedNotices = events.stream().filter(e -> "GENERATED".equalsIgnoreCase(e.getNoticeStatus())).count();

            status.put("activeCalendar", cal.getTitle());
            status.put("academicYear", cal.getAcademicYear());
            status.put("totalEvents", events.size());
            status.put("pendingAutoNotices", pendingNotices);
            status.put("generatedAutoNotices", generatedNotices);
            status.put("schedulerCron", "Every morning at 07:00 AM (0 0 7 * * ?)");
            status.put("operationalStatus", "ACTIVE");
        } else {
            status.put("activeCalendar", null);
            status.put("operationalStatus", "IDLE (No active calendar)");
        }

        return ResponseEntity.ok(status);
    }
}
