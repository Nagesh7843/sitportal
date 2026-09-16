package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "divisions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Division {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "academic_year_id")
    private Long academicYearId;

    @Column(name = "year_level", nullable = false, length = 20)
    private String yearLevel; // FE, SE, TE, BE

    @Column(nullable = false, length = 20)
    private String name; // Division A, Division B
}
