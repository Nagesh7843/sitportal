package com.sit.portal.repository;

import com.sit.portal.entity.DeviceNoticeDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceNoticeDeliveryRepository extends JpaRepository<DeviceNoticeDelivery, Long> {

    boolean existsByNoticeIdAndDeviceEndpoint(Long noticeId, String deviceEndpoint);

    Optional<DeviceNoticeDelivery> findByNoticeIdAndDeviceEndpoint(Long noticeId, String deviceEndpoint);

    List<DeviceNoticeDelivery> findByNoticeId(Long noticeId);

    List<DeviceNoticeDelivery> findByUserEmail(String userEmail);

    @Query("SELECT d.deviceEndpoint FROM DeviceNoticeDelivery d WHERE d.noticeId = :noticeId AND d.deliveryStatus = 'DELIVERED'")
    List<String> findDeliveredEndpointsByNoticeId(@Param("noticeId") Long noticeId);

    @Query("SELECT d.deviceEndpoint FROM DeviceNoticeDelivery d WHERE d.noticeId = :noticeId AND d.deviceEndpoint IN :endpoints AND d.deliveryStatus = 'DELIVERED'")
    List<String> findDeliveredEndpointsByNoticeIdAndEndpointsIn(
        @Param("noticeId") Long noticeId,
        @Param("endpoints") Collection<String> endpoints
    );
}
