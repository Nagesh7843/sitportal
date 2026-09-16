package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_change_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id")
    private Long studentId;

    @Column(nullable = false, length = 50)
    private String prn;

    @Column(name = "field_name", nullable = false, length = 100)
    private String fieldName;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", nullable = false, columnDefinition = "TEXT")
    private String newValue;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column(name = "verified_by_user_id")
    private Long verifiedByUserId;

    private LocalDateTime verifiedAt;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
