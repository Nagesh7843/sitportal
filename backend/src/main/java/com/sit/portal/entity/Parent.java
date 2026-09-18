package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "parents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Parent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "parent_name", nullable = false)
    @Builder.Default
    private String parentName = "Parent/Guardian";

    @Column(name = "email")
    private String email;

    @Column(name = "phone")
    private String phone;

    @Column(name = "student_roll_no", nullable = false)
    private String studentRollNo;

    @Column(name = "student_name")
    private String studentName;

    @Column(name = "relationship")
    @Builder.Default
    private String relationship = "Parent/Guardian";

    @Column(name = "alternate_phone")
    private String alternatePhone;

    @Column(name = "occupation")
    private String occupation;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    @PreUpdate
    protected void ensureDefaults() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.parentName == null || this.parentName.trim().isEmpty()) {
            this.parentName = (this.studentName != null && !this.studentName.trim().isEmpty())
                    ? "Parent of " + this.studentName.trim()
                    : "Parent/Guardian";
        }
    }
}
