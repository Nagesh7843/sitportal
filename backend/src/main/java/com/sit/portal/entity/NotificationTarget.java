package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_targets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "notification_id", nullable = false)
    private Long notificationId;

    @Column(name = "scope_type", nullable = false, length = 50)
    private String scopeType; // COLLEGE, DEPARTMENT, PROGRAM, YEAR, SEMESTER, DIVISION, BATCH, INDIVIDUAL

    @Column(name = "scope_id", nullable = false, length = 100)
    private String scopeId;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
