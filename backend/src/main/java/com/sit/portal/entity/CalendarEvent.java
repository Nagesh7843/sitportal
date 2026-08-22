package com.sit.portal.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "calendar_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "calendar_id", nullable = false)
    @JsonIgnore
    private AcademicCalendar calendar;

    @Column(nullable = false)
    private String title;

    @Column(name = "event_type", nullable = false)
    private String eventType; // EXAM, ASSIGNMENT, PROJECT_REVIEW, HOLIDAY, WORKSHOP, FEST, RESULT, REGISTRATION, GENERAL

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "target_audience")
    @Builder.Default
    private String targetAudience = "ALL"; // ALL, STUDENT, PARENT, FACULTY

    private String location;

    @Column(name = "is_notice_planned")
    @Builder.Default
    private Boolean isNoticePlanned = true;

    @Column(name = "days_before_notice")
    @Builder.Default
    private Integer daysBeforeNotice = 7;

    @Column(name = "notice_status")
    @Builder.Default
    private String noticeStatus = "PENDING"; // PENDING, GENERATED, DISABLED

    @Column(name = "generated_notice_id")
    private Long generatedNoticeId;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
