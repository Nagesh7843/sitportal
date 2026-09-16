package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "parent_student_relationships", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"parent_id", "student_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParentStudentRelationship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "parent_id", nullable = false)
    private Long parentId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(nullable = false, length = 50)
    private String prn;

    @Column(name = "relationship_type", length = 50)
    @Builder.Default
    private String relationshipType = "Parent/Guardian";

    @Column(length = 20)
    @Builder.Default
    private String status = "VERIFIED"; // VERIFIED, PENDING, REJECTED

    @Builder.Default
    private LocalDateTime verifiedAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
