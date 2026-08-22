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
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
