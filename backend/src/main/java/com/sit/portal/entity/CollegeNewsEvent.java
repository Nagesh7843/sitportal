package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "college_news_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollegeNewsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 500)
    private String eventKey;

    private String title;

    private String category;

    @Column(name = "event_date_str")
    private String eventDateStr;

    @Column(name = "event_date")
    private LocalDate eventDate;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "source_url", columnDefinition = "TEXT")
    private String sourceUrl;

    private String location;

    private String organizer;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @PrePersist
    public void onCreate() {
        if (this.publishedAt == null) {
            this.publishedAt = LocalDateTime.now();
        }
        if (this.expiresAt == null) {
            // Automatically expire 30 days after event date (or 30 days after publication if date not parseable)
            if (this.eventDate != null) {
                this.expiresAt = this.eventDate.atStartOfDay().plusDays(30);
            } else {
                this.expiresAt = this.publishedAt.plusDays(30);
            }
        }
    }
}
