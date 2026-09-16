package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "placement_eligibility_results", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"placement_drive_id", "student_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlacementEligibilityResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "placement_drive_id", nullable = false)
    private Long placementDriveId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(nullable = false, length = 50)
    private String prn;

    @Column(name = "is_eligible", nullable = false)
    private Boolean isEligible;

    @Column(name = "evaluation_reason", columnDefinition = "TEXT")
    private String evaluationReason;

    @Builder.Default
    private LocalDateTime evaluatedAt = LocalDateTime.now();
}
