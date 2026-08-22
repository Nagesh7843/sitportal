package com.sit.portal.service;

import com.sit.portal.entity.AcademicCalendar;
import com.sit.portal.entity.ActivityLog;
import com.sit.portal.entity.CalendarEvent;
import com.sit.portal.entity.Notice;
import com.sit.portal.repository.AcademicCalendarRepository;
import com.sit.portal.repository.ActivityLogRepository;
import com.sit.portal.repository.CalendarEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class AutomaticNoticeSchedulerService {

    @Autowired
    private AcademicCalendarRepository academicCalendarRepository;

    @Autowired
    private CalendarEventRepository calendarEventRepository;

    @Autowired
    private NoticeService noticeService;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    /**
     * Daily Background Task: Runs every morning at 7:00 AM.
     * Evaluates active semester calendar events and auto-generates notices whose trigger threshold is reached.
     */
    @Scheduled(cron = "0 0 7 * * ?")
    @Transactional
    public Map<String, Object> runSchedulerJob() {
        Map<String, Object> report = new HashMap<>();
        List<String> generatedNotices = new ArrayList<>();

        Optional<AcademicCalendar> activeCalendarOpt = academicCalendarRepository.findByIsActiveTrue();
        if (activeCalendarOpt.isEmpty()) {
            report.put("status", "SKIPPED");
            report.put("message", "No active academic calendar found. Scheduler skipped.");
            return report;
        }

        AcademicCalendar activeCalendar = activeCalendarOpt.get();
        List<CalendarEvent> pendingEvents = calendarEventRepository
                .findByCalendarIdAndNoticeStatusAndIsNoticePlannedTrue(activeCalendar.getId(), "PENDING");

        LocalDate today = LocalDate.now();

        for (CalendarEvent event : pendingEvents) {
            int daysBefore = event.getDaysBeforeNotice() != null ? event.getDaysBeforeNotice() : 7;
            LocalDate triggerDate = event.getStartDate().minusDays(daysBefore);

            if (!today.isBefore(triggerDate)) {
                // Time to trigger this routine academic notice
                String dateStr = event.getStartDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy"));
                if (event.getEndDate() != null && !event.getEndDate().isEqual(event.getStartDate())) {
                    dateStr += " to " + event.getEndDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy"));
                }

                String venueStr = (event.getLocation() != null && !event.getLocation().isEmpty()) 
                        ? "\nLocation / Venue: " + event.getLocation() 
                        : "";

                String content = String.format(
                        "Dear Students, Parents, and Faculty Members,\n\n" +
                        "This is an automated academic notice regarding upcoming '%s'.\n\n" +
                        "Event Schedule: %s%s\n\n" +
                        "Details: %s\n\n" +
                        "All concerned students and parents are requested to take note of the schedule. For any queries, please post on the Central Question System.",
                        event.getTitle(),
                        dateStr,
                        venueStr,
                        (event.getDescription() != null ? event.getDescription() : "Routine Academic Calendar Event")
                );

                Map<String, Object> targetAudience = new HashMap<>();
                targetAudience.put("roles", Arrays.asList("STUDENT", "PARENT", "FACULTY"));
                targetAudience.put("audience", event.getTargetAudience());
                targetAudience.put("semesterCalendar", activeCalendar.getTitle());

                Notice notice = Notice.builder()
                        .title("[Academic Notice] " + event.getTitle())
                        .content(content)
                        .category("Academics")
                        .priority("HIGH")
                        .status("PUBLISHED")
                        .authorName("Department Academic Scheduler")
                        .authorRole("Academic Coordinator")
                        .targetAudience(targetAudience)
                        .build();

                Notice savedNotice = noticeService.createNotice(notice);

                // Update event status
                event.setNoticeStatus("GENERATED");
                event.setGeneratedNoticeId(savedNotice.getId());
                calendarEventRepository.save(event);

                // Add Activity Log
                try {
                    ActivityLog log = ActivityLog.builder()
                            .title("Auto Notice Generated: " + event.getTitle())
                            .subtitle("Generated " + daysBefore + " days prior to event (" + event.getTargetAudience() + ")")
                            .timeAgo("Just now")
                            .icon("auto_awesome")
                            .type("notice")
                            .colorBg("bg-[#e0f2fe]")
                            .colorIcon("text-[#0284c7]")
                            .build();
                    activityLogRepository.save(log);
                } catch (Exception e) {
                    System.err.println("Failed to write activity log for scheduler: " + e.getMessage());
                }

                generatedNotices.add(event.getTitle() + " (ID: " + savedNotice.getId() + ")");
            }
        }

        report.put("status", "SUCCESS");
        report.put("activeCalendar", activeCalendar.getTitle());
        report.put("scannedEventsCount", pendingEvents.size());
        report.put("generatedCount", generatedNotices.size());
        report.put("generatedNotices", generatedNotices);
        report.put("executedAt", java.time.LocalDateTime.now().toString());

        return report;
    }
}
