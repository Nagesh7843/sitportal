package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // admin, faculty, student

    private String roleTitle;

    private String department;

    private String phone;

    @Column(columnDefinition = "TEXT")
    private String avatar;

    @Column(length = 1000)
    private String bio;

    private String officeLocation;

    private String qualification;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
