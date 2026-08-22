package com.sit.portal.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "question_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    @JsonIgnore
    private Question question;

    @Column(name = "responder_id")
    private Long responderId;

    @Column(name = "responder_name", nullable = false)
    private String responderName;

    @Column(name = "responder_role", nullable = false)
    private String responderRole; // faculty, hod, admin

    @Column(name = "responder_title")
    private String responderTitle;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "is_official_answer")
    @Builder.Default
    private Boolean isOfficialAnswer = true;

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
