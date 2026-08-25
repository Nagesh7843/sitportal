package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "placed_students_achievements")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacedStudentAchievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_name", nullable = false, length = 150)
    private String studentName;

    @Column(name = "prn", length = 50)
    private String prn;

    @Column(name = "division", length = 20)
    private String division;

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl;

    @Column(name = "company_name", nullable = false, length = 150)
    private String companyName;

    @Column(name = "company_logo_url", length = 500)
    private String companyLogoUrl;

    @Column(name = "role", length = 150)
    private String role;

    @Column(name = "package_lpa", length = 50)
    private String packageLpa;

    @Column(name = "batch_year", length = 50)
    private String batchYear;

    @Column(name = "placed_date", length = 50)
    private String placedDate;

    @Column(name = "banner_image_url", columnDefinition = "TEXT")
    private String bannerImageUrl;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
