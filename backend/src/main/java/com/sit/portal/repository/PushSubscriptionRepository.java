package com.sit.portal.repository;

import com.sit.portal.entity.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {
    Optional<PushSubscription> findFirstByEndpoint(String endpoint);
    List<PushSubscription> findAllByEndpoint(String endpoint);
    List<PushSubscription> findByUserEmailIn(Collection<String> emails);
    List<PushSubscription> findByUserEmail(String email);
    List<PushSubscription> findByUserIdIn(Collection<Long> userIds);
}
