package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "faculty_batch_assignments", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"faculty_id", "batch_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacultyBatchAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "faculty_id", nullable = false)
    private Long facultyId;

    @Column(name = "batch_id", nullable = false)
    private Long batchId;

    @Column(length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
