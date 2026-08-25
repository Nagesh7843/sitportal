package com.sit.portal.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notice_reads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoticeRead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long noticeId;

    @Column(nullable = false)
    private String userIdentifier;

    @Builder.Default
    private LocalDateTime readAt = LocalDateTime.now();
}
