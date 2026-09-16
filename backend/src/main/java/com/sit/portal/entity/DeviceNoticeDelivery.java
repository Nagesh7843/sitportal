package com.sit.portal.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "device_notice_deliveries",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_notice_device_delivery", columnNames = {"notice_id", "device_endpoint"})
    },
    indexes = {
        @Index(name = "idx_device_deliveries_notice", columnList = "notice_id"),
        @Index(name = "idx_device_deliveries_endpoint", columnList = "device_endpoint"),
        @Index(name = "idx_device_deliveries_email", columnList = "user_email")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceNoticeDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "notice_id", nullable = false)
    private Long noticeId;

    @Column(name = "device_endpoint", nullable = false, length = 1000)
    private String deviceEndpoint;

    @Column(name = "user_email", length = 150)
    private String userEmail;

    @Column(name = "device_type", length = 100)
    @Builder.Default
    private String deviceType = "Web Browser";

    @Column(name = "delivery_status", length = 30)
    @Builder.Default
    private String deliveryStatus = "DELIVERED"; // DELIVERED, SKIPPED_DUPLICATE, FAILED

    @Column(name = "idempotency_key", length = 255)
    private String idempotencyKey;

    @CreationTimestamp
    @Column(name = "sent_at", updatable = false)
    private LocalDateTime sentAt;
}
