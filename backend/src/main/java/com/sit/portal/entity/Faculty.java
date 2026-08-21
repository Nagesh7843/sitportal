package com.sit.portal.entity;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "faculty")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Faculty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String specialization;

    @Column(name = "rank_title")
    @JsonAlias({"rankTitle", "rank", "designation"})
    private String rankTitle;

    @Transient
    @JsonProperty("rank")
    private String rank;

    @Column(name = "designation")
    @JsonProperty("designation")
    private String designation;

    @Column(name = "qualification")
    private String qualification;

    @Column(name = "teaching_experience")
    private String teachingExperience;

    @Column(name = "industrial_experience")
    private String industrialExperience;

    @Column(name = "department")
    @Builder.Default
    private String department = "CSE";

    @Builder.Default
    private String status = "ON CAMPUS"; // 'ON CAMPUS', 'IN MEETING', 'IN LAB', 'OFF CAMPUS'

    @Column(nullable = false)
    private String email;

    @Column(name = "office_hours")
    private String officeHours;

    @Column(columnDefinition = "TEXT")
    private String avatar;

    @Column(name = "publications_count")
    @Builder.Default
    private Integer publicationsCount = 0;

    @PrePersist
    @PreUpdate
    public void sanitizeAndSync() {
        if (this.rankTitle == null || this.rankTitle.isBlank()) {
            if (this.designation != null && !this.designation.isBlank()) {
                this.rankTitle = this.designation;
            } else if (this.rank != null && !this.rank.isBlank()) {
                this.rankTitle = this.rank;
            } else {
                this.rankTitle = "Faculty";
            }
        }
        if (this.designation == null || this.designation.isBlank()) {
            this.designation = this.rankTitle;
        }
        if (this.rank == null || this.rank.isBlank()) {
            this.rank = this.rankTitle;
        }
        if (this.status == null || this.status.isBlank()) {
            this.status = "ON CAMPUS";
        }
        if (this.department == null || this.department.isBlank()) {
            this.department = "CSE";
        }
        if (this.publicationsCount == null) {
            this.publicationsCount = 0;
        }
    }

    public String getRank() {
        return this.rank != null ? this.rank : (this.designation != null ? this.designation : this.rankTitle);
    }
}
