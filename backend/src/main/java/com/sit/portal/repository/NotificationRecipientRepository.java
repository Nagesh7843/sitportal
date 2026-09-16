package com.sit.portal.repository;

import com.sit.portal.entity.NotificationRecipient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRecipientRepository extends JpaRepository<NotificationRecipient, Long> {
    List<NotificationRecipient> findByUserIdOrderByDeliveredAtDesc(Long userId);
    List<NotificationRecipient> findByUserIdAndIsReadFalse(Long userId);
    Optional<NotificationRecipient> findByNotificationIdAndUserId(Long notificationId, Long userId);
    long countByUserIdAndIsReadFalse(Long userId);
}
