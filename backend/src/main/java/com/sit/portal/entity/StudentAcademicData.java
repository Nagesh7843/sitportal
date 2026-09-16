package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_academic_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAcademicData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", unique = true, nullable = false)
    private Long studentId;

    @Column(nullable = false, unique = true, length = 50)
    private String prn;

    @Column(precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal cgpa = BigDecimal.ZERO;

    @Column(name = "tenth_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal tenthPercentage = BigDecimal.ZERO;

    @Column(name = "twelfth_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal twelfthPercentage = BigDecimal.ZERO;

    @Column(name = "diploma_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal diplomaPercentage = BigDecimal.ZERO;

    @Column(name = "qualification_path", length = 20)
    @Builder.Default
    private String qualificationPath = "12TH"; // 12TH or DIPLOMA

    @Column(name = "active_backlogs")
    @Builder.Default
    private Integer activeBacklogs = 0;

    @Column(name = "total_backlogs")
    @Builder.Default
    private Integer totalBacklogs = 0;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
