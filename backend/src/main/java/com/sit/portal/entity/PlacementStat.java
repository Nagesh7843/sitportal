package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "placement_stats")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "highest_package")
    private String highestPackage;

    @Column(name = "average_package")
    private String averagePackage;

    @Column(name = "placement_ratio")
    private String placementRatio;

    @Column(name = "total_offers")
    private String totalOffers;

    @Column(name = "batch_year")
    private String batchYear;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
