package com.sit.portal.controller;

import com.sit.portal.entity.AcademicCalendar;
import com.sit.portal.entity.ActivityLog;
import com.sit.portal.entity.CalendarEvent;
import com.sit.portal.repository.AcademicCalendarRepository;
import com.sit.portal.repository.ActivityLogRepository;
import com.sit.portal.repository.CalendarEventRepository;
import com.sit.portal.service.AcademicCalendarDocParserService;
import com.sit.portal.service.PushNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/academic-calendars")
public class AcademicCalendarController {

    @Autowired
    private AcademicCalendarRepository academicCalendarRepository;

    @Autowired
    private CalendarEventRepository calendarEventRepository;

    @Autowired
    private AcademicCalendarDocParserService docParserService;

    @Autowired
    private PushNotificationService pushNotificationService;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @PostMapping(value = "/upload-doc", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAndParseCalendarDoc(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "academicYear", required = false) String academicYear,
            @RequestParam(value = "semesterType", required = false) String semesterType
    ) {
        try {
            AcademicCalendar parsed = docParserService.parseCalendarDocument(file, title, academicYear, semesterType);

            // Deactivate existing calendars
            List<AcademicCalendar> all = academicCalendarRepository.findAll();
            for (AcademicCalendar c : all) {
                if (Boolean.TRUE.equals(c.getIsActive())) {
                    c.setIsActive(false);
                    academicCalendarRepository.save(c);
                }
            }

            AcademicCalendar saved = academicCalendarRepository.save(parsed);

            // Broadcast Chrome Desktop notification to all users
            String pushTitle = "📅 New Academic Calendar Ingested";
            String pushBody = String.format("Official %s (%s) has been integrated with %d scheduled milestone notices.",
                    saved.getTitle(), saved.getAcademicYear(), saved.getEvents().size());
            pushNotificationService.sendPushNotificationToAll(pushTitle, pushBody);

            try {
                activityLogRepository.save(ActivityLog.builder()
                        .title("Academic Calendar Ingested: " + saved.getTitle())
                        .subtitle("Ingested from file with " + saved.getEvents().size() + " scheduled milestones")
                        .timeAgo("Just now")
                        .icon("calendar_month")
                        .type("calendar")
                        .colorBg("bg-[#e0f2fe]")
                        .colorIcon("text-[#0284c7]")
                        .build());
            } catch (Exception ignored) {}

            return ResponseEntity.status(201).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to parse academic calendar document: " + e.getMessage()));
        }
    }

    @PostMapping("/parse-text")
    public ResponseEntity<?> parseCalendarText(@RequestBody Map<String, String> payload) {
        try {
            String text = payload.getOrDefault("text", "");
            String title = payload.getOrDefault("title", "Department Academic Calendar");
            String academicYear = payload.getOrDefault("academicYear", "2025-2026");
            String semesterType = payload.getOrDefault("semesterType", "EVEN");

            List<CalendarEvent> extracted = docParserService.parseRawText(text);
            if (extracted.isEmpty()) {
                extracted = docParserService.generateDefaultSemesterEvents();
            }

            AcademicCalendar calendar = AcademicCalendar.builder()
                    .title(title)
                    .academicYear(academicYear)
                    .semesterType(semesterType)
                    .startDate(extracted.get(0).getStartDate())
                    .endDate(extracted.get(extracted.size() - 1).getStartDate().plusDays(15))
                    .isActive(true)
                    .events(new java.util.ArrayList<>())
                    .build();

            for (CalendarEvent e : extracted) {
                e.setCalendar(calendar);
                calendar.getEvents().add(e);
            }

            List<AcademicCalendar> all = academicCalendarRepository.findAll();
            for (AcademicCalendar c : all) {
                c.setIsActive(false);
                academicCalendarRepository.save(c);
            }

            AcademicCalendar saved = academicCalendarRepository.save(calendar);

            pushNotificationService.sendPushNotificationToAll("📅 Academic Calendar Synchronized",
                    "The academic event scheduler is now tracking " + saved.getEvents().size() + " semester events.");

            return ResponseEntity.status(201).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Failed to parse calendar text: " + e.getMessage()));
        }
    }

    @GetMapping
    public List<AcademicCalendar> getAllCalendars() {
        return academicCalendarRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/active")
    public ResponseEntity<?> getActiveCalendar() {
        Optional<AcademicCalendar> activeOpt = academicCalendarRepository.findByIsActiveTrue();
        if (activeOpt.isPresent()) {
            AcademicCalendar cal = activeOpt.get();
            List<CalendarEvent> events = calendarEventRepository.findByCalendarIdOrderByStartDateAsc(cal.getId());
            cal.setEvents(events);
            return ResponseEntity.ok(cal);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCalendarById(@PathVariable Long id) {
        return academicCalendarRepository.findById(id).map(cal -> {
            List<CalendarEvent> events = calendarEventRepository.findByCalendarIdOrderByStartDateAsc(cal.getId());
            cal.setEvents(events);
            return ResponseEntity.ok(cal);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createCalendar(@RequestBody AcademicCalendar calendar) {
        if (calendar.getTitle() == null || calendar.getAcademicYear() == null || calendar.getStartDate() == null || calendar.getEndDate() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Title, academicYear, startDate, and endDate are required."));
        }

        if (Boolean.TRUE.equals(calendar.getIsActive())) {
            // Deactivate existing calendars
            List<AcademicCalendar> all = academicCalendarRepository.findAll();
            for (AcademicCalendar c : all) {
                if (Boolean.TRUE.equals(c.getIsActive())) {
                    c.setIsActive(false);
                    academicCalendarRepository.save(c);
                }
            }
        }

        AcademicCalendar saved = academicCalendarRepository.save(calendar);
        return ResponseEntity.status(201).body(saved);
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activateCalendar(@PathVariable Long id) {
        Optional<AcademicCalendar> targetOpt = academicCalendarRepository.findById(id);
        if (targetOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<AcademicCalendar> all = academicCalendarRepository.findAll();
        for (AcademicCalendar c : all) {
            c.setIsActive(c.getId().equals(id));
            academicCalendarRepository.save(c);
        }

        return ResponseEntity.ok(Map.of("message", "Calendar activated successfully.", "activeId", id));
    }

    @PostMapping("/{id}/events")
    public ResponseEntity<?> addEventToCalendar(@PathVariable Long id, @RequestBody CalendarEvent event) {
        Optional<AcademicCalendar> calOpt = academicCalendarRepository.findById(id);
        if (calOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (event.getTitle() == null || event.getStartDate() == null || event.getEventType() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Title, eventType, and startDate are required."));
        }

        event.setCalendar(calOpt.get());
        if (event.getTargetAudience() == null) event.setTargetAudience("ALL");
        if (event.getNoticeStatus() == null) event.setNoticeStatus("PENDING");

        CalendarEvent savedEvent = calendarEventRepository.save(event);
        return ResponseEntity.status(201).body(savedEvent);
    }

    @PutMapping("/events/{eventId}")
    public ResponseEntity<?> updateCalendarEvent(@PathVariable Long eventId, @RequestBody CalendarEvent updated) {
        return calendarEventRepository.findById(eventId).map(existing -> {
            if (updated.getTitle() != null) existing.setTitle(updated.getTitle());
            if (updated.getEventType() != null) existing.setEventType(updated.getEventType());
            if (updated.getStartDate() != null) existing.setStartDate(updated.getStartDate());
            if (updated.getEndDate() != null) existing.setEndDate(updated.getEndDate());
            if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
            if (updated.getTargetAudience() != null) existing.setTargetAudience(updated.getTargetAudience());
            if (updated.getLocation() != null) existing.setLocation(updated.getLocation());
            if (updated.getIsNoticePlanned() != null) existing.setIsNoticePlanned(updated.getIsNoticePlanned());
            if (updated.getDaysBeforeNotice() != null) existing.setDaysBeforeNotice(updated.getDaysBeforeNotice());
            if (updated.getNoticeStatus() != null) existing.setNoticeStatus(updated.getNoticeStatus());
            return ResponseEntity.ok(calendarEventRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/events/{eventId}")
    public ResponseEntity<?> deleteCalendarEvent(@PathVariable Long eventId) {
        if (!calendarEventRepository.existsById(eventId)) {
            return ResponseEntity.notFound().build();
        }
        calendarEventRepository.deleteById(eventId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCalendar(@PathVariable Long id) {
        if (!academicCalendarRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        academicCalendarRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
