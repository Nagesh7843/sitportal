package com.sit.portal.service;

import com.sit.portal.dto.DeviceDeliverySummaryResponse;
import com.sit.portal.dto.SendNoticeCriteriaRequest;
import com.sit.portal.dto.TargetCriteriaDto;
import com.sit.portal.entity.DeviceNoticeDelivery;
import com.sit.portal.entity.Notice;
import com.sit.portal.entity.PushSubscription;
import com.sit.portal.repository.*;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.security.spec.ECGenParameterSpec;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PushNotificationServiceTest {

    @Mock
    private PushSubscriptionRepository repository;

    @Mock
    private DeviceNoticeDeliveryRepository deliveryRepository;

    @Mock
    private NoticeRepository noticeRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PushService mockPushService;

    @InjectMocks
    private PushNotificationService pushNotificationService;

    private PushSubscription sub1;
    private PushSubscription sub2;
    private Notice notice;

    @BeforeEach
    void setUp() throws Exception {
        Security.addProvider(new BouncyCastleProvider());

        // Generate cryptographically valid P-256 EC keys
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("ECDSA", "BC");
        ECGenParameterSpec ecSpec = new ECGenParameterSpec("secp256r1");
        kpg.initialize(ecSpec);
        KeyPair kp = kpg.generateKeyPair();
        org.bouncycastle.jce.interfaces.ECPublicKey ecPub = (org.bouncycastle.jce.interfaces.ECPublicKey) kp.getPublic();
        byte[] encodedPoint = ecPub.getQ().getEncoded(false);

        String p256 = Base64.getUrlEncoder().withoutPadding().encodeToString(encodedPoint);
        String auth = Base64.getUrlEncoder().withoutPadding().encodeToString(new byte[16]);

        sub1 = new PushSubscription(1L, "https://fcm.googleapis.com/fcm/send/device-token-1", p256, auth, "student1@sit.edu", 101L, null);
        sub2 = new PushSubscription(2L, "https://fcm.googleapis.com/fcm/send/device-token-2", p256, auth, "student2@sit.edu", 102L, null);

        notice = Notice.builder()
                .id(10L)
                .title("Exam Schedule Notice")
                .content("Semester final exams start next Monday.")
                .build();

        pushNotificationService.setPushService(mockPushService);
    }

    @Test
    void testSelectionValidationFailsWhenZeroDevicesMatch() {
        TargetCriteriaDto criteria = TargetCriteriaDto.builder()
                .department("CIVIL")
                .academicYears(List.of("FE"))
                .build();

        SendNoticeCriteriaRequest request = SendNoticeCriteriaRequest.builder()
                .noticeId(10L)
                .criteria(criteria)
                .build();

        when(studentRepository.findByDepartment("CIVIL")).thenReturn(Collections.emptyList());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            pushNotificationService.sendNoticeToTargetDevices(request);
        });

        assertTrue(ex.getMessage().contains("Selection validation failed"));
    }

    @Test
    void testDispatchDeliversToNewDevicesAndRecordsInDb() {
        TargetCriteriaDto criteria = TargetCriteriaDto.builder()
                .deviceEndpoints(List.of("https://fcm.googleapis.com/fcm/send/device-token-1"))
                .build();

        SendNoticeCriteriaRequest request = SendNoticeCriteriaRequest.builder()
                .noticeId(10L)
                .criteria(criteria)
                .build();

        when(repository.findAllByEndpoint("https://fcm.googleapis.com/fcm/send/device-token-1"))
                .thenReturn(List.of(sub1));
        when(noticeRepository.findById(10L)).thenReturn(Optional.of(notice));
        when(deliveryRepository.findDeliveredEndpointsByNoticeIdAndEndpointsIn(eq(10L), anyCollection()))
                .thenReturn(Collections.emptyList());
        when(deliveryRepository.existsByNoticeIdAndDeviceEndpoint(10L, "https://fcm.googleapis.com/fcm/send/device-token-1"))
                .thenReturn(false);

        DeviceDeliverySummaryResponse response = pushNotificationService.sendNoticeToTargetDevices(request);

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertEquals(1, response.getNewlyDeliveredCount());
        assertEquals(0, response.getDuplicatesSkippedCount());
        verify(deliveryRepository, times(1)).save(any(DeviceNoticeDelivery.class));
    }

    @Test
    void testDuplicatePreventionSkipsAlreadyDeliveredDevices() {
        TargetCriteriaDto criteria = TargetCriteriaDto.builder()
                .deviceEndpoints(List.of("https://fcm.googleapis.com/fcm/send/device-token-1"))
                .build();

        SendNoticeCriteriaRequest request = SendNoticeCriteriaRequest.builder()
                .noticeId(10L)
                .criteria(criteria)
                .build();

        when(repository.findAllByEndpoint("https://fcm.googleapis.com/fcm/send/device-token-1"))
                .thenReturn(List.of(sub1));
        when(noticeRepository.findById(10L)).thenReturn(Optional.of(notice));
        // Endpoint was already delivered for notice 10
        when(deliveryRepository.findDeliveredEndpointsByNoticeIdAndEndpointsIn(eq(10L), anyCollection()))
                .thenReturn(List.of("https://fcm.googleapis.com/fcm/send/device-token-1"));

        DeviceDeliverySummaryResponse response = pushNotificationService.sendNoticeToTargetDevices(request);

        assertNotNull(response);
        assertEquals("DUPLICATES_SKIPPED", response.getStatus());
        assertEquals(0, response.getNewlyDeliveredCount());
        assertEquals(1, response.getDuplicatesSkippedCount());
        assertTrue(response.getMessage().contains("Duplicate prevention"));
        verify(deliveryRepository, never()).save(any(DeviceNoticeDelivery.class));
    }

    @Test
    void testMultiDeviceCriteriaWithPartialDuplicates() {
        TargetCriteriaDto criteria = TargetCriteriaDto.builder()
                .deviceEndpoints(List.of(
                        "https://fcm.googleapis.com/fcm/send/device-token-1",
                        "https://fcm.googleapis.com/fcm/send/device-token-2"
                ))
                .build();

        SendNoticeCriteriaRequest request = SendNoticeCriteriaRequest.builder()
                .noticeId(10L)
                .criteria(criteria)
                .build();

        when(repository.findAllByEndpoint("https://fcm.googleapis.com/fcm/send/device-token-1")).thenReturn(List.of(sub1));
        when(repository.findAllByEndpoint("https://fcm.googleapis.com/fcm/send/device-token-2")).thenReturn(List.of(sub2));
        when(noticeRepository.findById(10L)).thenReturn(Optional.of(notice));
        // Device 1 already has it, Device 2 is new
        when(deliveryRepository.findDeliveredEndpointsByNoticeIdAndEndpointsIn(eq(10L), anyCollection()))
                .thenReturn(List.of("https://fcm.googleapis.com/fcm/send/device-token-1"));
        when(deliveryRepository.existsByNoticeIdAndDeviceEndpoint(10L, "https://fcm.googleapis.com/fcm/send/device-token-2"))
                .thenReturn(false);

        DeviceDeliverySummaryResponse response = pushNotificationService.sendNoticeToTargetDevices(request);

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertEquals(2, response.getTotalTargetDevices());
        assertEquals(1, response.getNewlyDeliveredCount());
        assertEquals(1, response.getDuplicatesSkippedCount());
        verify(deliveryRepository, times(1)).save(any(DeviceNoticeDelivery.class));
    }
}
