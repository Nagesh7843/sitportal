package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Builder.Default
    private String activeDepartment = "Computer Science & Engineering";

    @Builder.Default
    private String academicYear = "2025-2026";

    @Builder.Default
    private String scraperInterval = "30";

    @Builder.Default
    private String retentionDays = "20";

    @Builder.Default
    private Boolean pushOnScrape = true;

    @Builder.Default
    private Boolean soundAlerts = true;

    @Builder.Default
    private Boolean emailAlerts = true;

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
