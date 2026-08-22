package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "academic_calendars")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicCalendar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(name = "academic_year", nullable = false)
    private String academicYear; // e.g. 2025-2026

    @Column(name = "semester_type", nullable = false)
    private String semesterType; // EVEN, ODD

    @Column(name = "semester")
    private String semester; // EVEN, ODD, Even Semester

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = false;

    @OneToMany(mappedBy = "calendar", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<CalendarEvent> events = new ArrayList<>();

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.semester == null || this.semester.isBlank()) {
            this.semester = (this.semesterType != null && !this.semesterType.isBlank()) ? this.semesterType : "EVEN";
        }
        if (this.semesterType == null || this.semesterType.isBlank()) {
            this.semesterType = (this.semester != null && !this.semester.isBlank()) ? this.semester : "EVEN";
        }
    }
}
