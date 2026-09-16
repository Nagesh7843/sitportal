package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "placement_drives")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementDrive {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(nullable = false)
    private String role;

    @Column(name = "package_lpa")
    private String packageLpa;

    @Column(name = "drive_date")
    private String driveDate;

    private String eligibility;

    @Column(name = "minimum_cgpa", precision = 4, scale = 2)
    private java.math.BigDecimal minimumCgpa;

    @Column(name = "minimum_tenth_percentage", precision = 5, scale = 2)
    private java.math.BigDecimal minimumTenthPercentage;

    @Column(name = "minimum_twelfth_percentage", precision = 5, scale = 2)
    private java.math.BigDecimal minimumTwelfthPercentage;

    @Column(name = "minimum_diploma_percentage", precision = 5, scale = 2)
    private java.math.BigDecimal minimumDiplomaPercentage;

    @Column(name = "max_active_backlogs")
    private Integer maxActiveBacklogs;

    @Column(name = "allowed_departments", length = 255)
    private String allowedDepartments;

    @Column(name = "allowed_academic_years", length = 100)
    private String allowedAcademicYears;

    private String location;

    @Column(name = "apply_deadline")
    private String applyDeadline;

    @Column(nullable = false)
    private String status; // UPCOMING, ONGOING, COMPLETED

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "banner_image_url", columnDefinition = "TEXT")
    private String bannerImageUrl;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null || this.status.trim().isEmpty()) {
            this.status = "UPCOMING";
        }
    }
}
