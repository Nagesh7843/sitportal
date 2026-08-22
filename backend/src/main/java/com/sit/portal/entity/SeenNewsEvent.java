package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "seen_news_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeenNewsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 500)
    private String eventKey;

    private String title;

    private String category;

    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;

    @PrePersist
    public void onCreate() {
        this.notifiedAt = LocalDateTime.now();
    }
}
