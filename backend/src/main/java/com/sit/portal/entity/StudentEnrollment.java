package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_enrollments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentEnrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(nullable = false, length = 50)
    private String prn;

    @Column(name = "academic_year_id")
    private Long academicYearId;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "program_id")
    private Long programId;

    @Column(name = "year_level", nullable = false, length = 20)
    private String yearLevel; // FE, SE, TE, BE

    @Column(name = "semester_id")
    private Long semesterId;

    @Column(name = "division_id")
    private Long divisionId;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "is_current")
    @Builder.Default
    private Boolean isCurrent = true;

    @Column(length = 20)
    @Builder.Default
    private String status = "ENROLLED";

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
