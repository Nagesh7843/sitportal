package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "placement_eligibility_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlacementEligibilityRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "placement_drive_id", nullable = false)
    private Long placementDriveId;

    @Column(name = "minimum_cgpa", precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal minimumCgpa = new BigDecimal("6.00");

    @Column(name = "minimum_tenth_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal minimumTenthPercentage = new BigDecimal("60.00");

    @Column(name = "minimum_twelfth_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal minimumTwelfthPercentage = new BigDecimal("60.00");

    @Column(name = "minimum_diploma_percentage", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal minimumDiplomaPercentage = new BigDecimal("60.00");

    @Column(name = "max_active_backlogs")
    @Builder.Default
    private Integer maxActiveBacklogs = 0;

    @Column(name = "allowed_departments", length = 255)
    @Builder.Default
    private String allowedDepartments = "CSE,AIDS,MECH,CIVIL,ENTC,ELECTRICAL,MECHATRONICS";

    @Column(name = "allowed_academic_years", length = 100)
    @Builder.Default
    private String allowedAcademicYears = "BE,TE";

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
