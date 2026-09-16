package com.sit.portal.service;

import com.sit.portal.dto.DeviceDeliverySummaryResponse;
import com.sit.portal.dto.SendNoticeCriteriaRequest;
import com.sit.portal.dto.TargetCriteriaDto;
import com.sit.portal.entity.DeviceNoticeDelivery;
import com.sit.portal.entity.Notice;
import com.sit.portal.entity.PushSubscription;
import com.sit.portal.entity.Student;
import com.sit.portal.entity.User;
import com.sit.portal.repository.*;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.security.GeneralSecurityException;
import java.security.Security;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class PushNotificationService {

    @Autowired
    private PushSubscriptionRepository repository;

    @Autowired
    private DeviceNoticeDeliveryRepository deliveryRepository;

    @Autowired
    private NoticeRepository noticeRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    private PushService pushService;

    @Value("${VAPID_PUBLIC_KEY:BIZRhlCjiAthaeVDsYk6XhYD-W0wByq8A65inxm8AjgA8WJQTgV1F5FDmtLP15cwPHXt3fsF5aVsFgJvu-usg7U}")
    private String publicKey;

    @Value("${VAPID_PRIVATE_KEY:g5y8LW8emWI87N44Rc_NFg1NbNUEKv0Ux7B22WBLfeI}")
    private String privateKey;

    @PostConstruct
    public void init() throws GeneralSecurityException {
        Security.addProvider(new BouncyCastleProvider());

        try {
            pushService = new PushService(publicKey, privateKey, "mailto:admin@sit.edu");
        } catch (Exception e) {
            log.error("Error initializing PushService with VAPID keys: {}", e.getMessage());
        }
    }

    public String getPublicKey() {
        return publicKey;
    }

    public void setPushService(PushService pushService) {
        this.pushService = pushService;
    }

    /**
     * Lists all registered devices / browser push subscriptions.
     */
    public List<Map<String, Object>> getRegisteredDevices() {
        List<PushSubscription> list = repository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (PushSubscription sub : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", sub.getId());
            map.put("endpoint", sub.getEndpoint());
            map.put("userEmail", sub.getUserEmail());
            map.put("userId", sub.getUserId());
            map.put("createdAt", sub.getCreatedAt());

            // Determine friendly device label from endpoint URL
            String deviceType = "Web Browser";
            String ep = sub.getEndpoint().toLowerCase();
            if (ep.contains("fcm.googleapis.com") || ep.contains("google")) {
                deviceType = "Chrome / Android";
            } else if (ep.contains("mozilla") || ep.contains("firefox")) {
                deviceType = "Mozilla Firefox";
            } else if (ep.contains("apple") || ep.contains("safari")) {
                deviceType = "Apple Safari / iOS";
            } else if (ep.contains("windows") || ep.contains("edge")) {
                deviceType = "Microsoft Edge";
            }
            map.put("deviceType", deviceType);

            result.add(map);
        }
        return result;
    }

    /**
     * Previews matching devices based on criteria, including duplicate prevention metrics if a noticeId is provided.
     */
    public Map<String, Object> previewTargetDevices(TargetCriteriaDto criteria) {
        Map<String, PushSubscription> targetDevicesMap = resolveTargetSubscriptions(criteria);
        int totalMatching = targetDevicesMap.size();

        Long noticeId = criteria != null ? criteria.getNoticeId() : null;
        List<String> alreadyDeliveredEndpoints = Collections.emptyList();

        if (noticeId != null && !targetDevicesMap.isEmpty()) {
            alreadyDeliveredEndpoints = deliveryRepository.findDeliveredEndpointsByNoticeIdAndEndpointsIn(
                noticeId, targetDevicesMap.keySet()
            );
        }

        int alreadyDeliveredCount = alreadyDeliveredEndpoints.size();
        int newToDeliverCount = totalMatching - alreadyDeliveredCount;

        List<Map<String, Object>> devicePreviews = new ArrayList<>();
        for (PushSubscription sub : targetDevicesMap.values()) {
            boolean isAlreadyDelivered = alreadyDeliveredEndpoints.contains(sub.getEndpoint());
            Map<String, Object> item = new HashMap<>();
            item.put("id", sub.getId());
            item.put("endpoint", sub.getEndpoint());
            item.put("userEmail", sub.getUserEmail());
            item.put("isAlreadyDelivered", isAlreadyDelivered);
            item.put("deliveryAction", isAlreadyDelivered ? "SKIP_DUPLICATE" : "DELIVER_NOTICE");
            devicePreviews.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalMatchingDevices", totalMatching);
        response.put("newToDeliverCount", newToDeliverCount);
        response.put("alreadyDeliveredCount", alreadyDeliveredCount);
        response.put("noticeId", noticeId);
        response.put("devices", devicePreviews);
        return response;
    }

    /**
     * Dispatches a notice to multiple devices based on criteria, strictly enforcing:
     * 1. Selection validation: At least 1 target device must be selected/matched.
     * 2. Exactly-once delivery per physical device: Endpoints are strictly deduplicated.
     * 3. Duplicate prevention: Already-delivered devices are skipped.
     * 4. Reliable delivery: Atomically recorded in DB with unique constraint protection.
     */
    @Transactional
    public DeviceDeliverySummaryResponse sendNoticeToTargetDevices(SendNoticeCriteriaRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body cannot be null.");
        }

        TargetCriteriaDto criteria = request.getCriteria();
        Map<String, PushSubscription> targetMap = resolveTargetSubscriptions(criteria);

        // 1. Selection Validation
        if (targetMap.isEmpty()) {
            throw new IllegalArgumentException("Selection validation failed: Exactly one or more target devices must be selected (0 matching devices found).");
        }

        // 2. Resolve Notice Details
        Long noticeId = request.getNoticeId();
        String title = request.getTitle();
        String message = request.getMessage();

        if (noticeId != null) {
            Optional<Notice> noticeOpt = noticeRepository.findById(noticeId);
            if (noticeOpt.isPresent()) {
                Notice n = noticeOpt.get();
                if (title == null || title.trim().isEmpty()) {
                    title = "Notice: " + n.getTitle();
                }
                if (message == null || message.trim().isEmpty()) {
                    message = n.getContent();
                }
            }
        }

        if (title == null || title.trim().isEmpty()) {
            title = "SIT Portal Announcement";
        }
        if (message == null || message.trim().isEmpty()) {
            message = "You have received an official department update.";
        }

        // 3. Duplicate Prevention Check
        List<String> alreadyDeliveredEndpoints = new ArrayList<>();
        if (noticeId != null) {
            alreadyDeliveredEndpoints = deliveryRepository.findDeliveredEndpointsByNoticeIdAndEndpointsIn(
                noticeId, targetMap.keySet()
            );
        }

        Set<String> alreadyDeliveredSet = new HashSet<>(alreadyDeliveredEndpoints);
        List<PushSubscription> toDeliver = new ArrayList<>();
        List<String> skippedEndpoints = new ArrayList<>();

        for (Map.Entry<String, PushSubscription> entry : targetMap.entrySet()) {
            String endpoint = entry.getKey();
            if (alreadyDeliveredSet.contains(endpoint)) {
                skippedEndpoints.add(endpoint);
            } else {
                toDeliver.add(entry.getValue());
            }
        }

        // If all selected devices have already received this notice, prevent duplicate send immediately
        if (toDeliver.isEmpty()) {
            return DeviceDeliverySummaryResponse.builder()
                .status("DUPLICATES_SKIPPED")
                .noticeId(noticeId)
                .noticeTitle(title)
                .totalTargetDevices(targetMap.size())
                .newlyDeliveredCount(0)
                .duplicatesSkippedCount(skippedEndpoints.size())
                .failedCount(0)
                .message(String.format("Duplicate prevention: All %d selected device(s) have already received this notice. No duplicate notifications were sent.", targetMap.size()))
                .deliveredAt(LocalDateTime.now().toString())
                .deliveredEndpoints(Collections.emptyList())
                .skippedEndpoints(skippedEndpoints)
                .build();
        }

        // 4. Reliable Dispatch & DB Recording for New Devices
        List<String> deliveredEndpoints = new ArrayList<>();
        int failedCount = 0;

        String safeTitle = title.replace("\"", "\\\"").replace("\n", " ");
        String safeMessage = message.replace("\"", "\\\"").replace("\n", " ");
        String payload = String.format("{\"title\":\"%s\", \"message\":\"%s\", \"noticeId\":%s}",
            safeTitle, safeMessage, noticeId != null ? noticeId : "null");

        for (PushSubscription sub : toDeliver) {
            String endpoint = sub.getEndpoint();
            
            // Check atomic DB existence to protect against concurrent duplicate requests
            if (noticeId != null && deliveryRepository.existsByNoticeIdAndDeviceEndpoint(noticeId, endpoint)) {
                skippedEndpoints.add(endpoint);
                continue;
            }

            // Record delivery attempt in DB
            DeviceNoticeDelivery delivery = DeviceNoticeDelivery.builder()
                .noticeId(noticeId != null ? noticeId : 0L)
                .deviceEndpoint(endpoint)
                .userEmail(sub.getUserEmail())
                .deviceType(getDeviceTypeFromEndpoint(endpoint))
                .deliveryStatus("DELIVERED")
                .idempotencyKey(request.getIdempotencyKey())
                .build();

            try {
                if (noticeId != null) {
                    deliveryRepository.save(delivery);
                }

                // Send Web Push notification
                boolean sent = dispatchWebPush(sub, payload);
                if (sent) {
                    deliveredEndpoints.add(endpoint);
                } else {
                    failedCount++;
                    if (noticeId != null) {
                        try {
                            delivery.setDeliveryStatus("FAILED");
                            deliveryRepository.save(delivery);
                        } catch (Exception ignored) {}
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to process delivery to endpoint {}: {}", endpoint, e.getMessage());
                failedCount++;
                if (noticeId != null) {
                    try {
                        delivery.setDeliveryStatus("FAILED");
                        deliveryRepository.save(delivery);
                    } catch (Exception ignored) {}
                }
            }
        }

        String summaryMsg = String.format(
            "Notice successfully delivered to %d device(s). %d device(s) were skipped as duplicates.",
            deliveredEndpoints.size(), skippedEndpoints.size()
        );

        return DeviceDeliverySummaryResponse.builder()
            .status("SUCCESS")
            .noticeId(noticeId)
            .noticeTitle(title)
            .totalTargetDevices(targetMap.size())
            .newlyDeliveredCount(deliveredEndpoints.size())
            .duplicatesSkippedCount(skippedEndpoints.size())
            .failedCount(failedCount)
            .message(summaryMsg)
            .deliveredAt(LocalDateTime.now().toString())
            .deliveredEndpoints(deliveredEndpoints)
            .skippedEndpoints(skippedEndpoints)
            .build();
    }

    /**
     * Resolves matching PushSubscriptions into a deduplicated Map by endpoint.
     */
    private Map<String, PushSubscription> resolveTargetSubscriptions(TargetCriteriaDto criteria) {
        Map<String, PushSubscription> map = new LinkedHashMap<>();

        if (criteria == null) {
            // Default: All active subscriptions
            for (PushSubscription s : repository.findAll()) {
                if (s.getEndpoint() != null && !s.getEndpoint().trim().isEmpty()) {
                    map.put(s.getEndpoint().trim(), s);
                }
            }
            return map;
        }

        // 1. Explicit device endpoints provided
        if (criteria.getDeviceEndpoints() != null && !criteria.getDeviceEndpoints().isEmpty()) {
            for (String ep : criteria.getDeviceEndpoints()) {
                if (ep != null && !ep.trim().isEmpty()) {
                    List<PushSubscription> subs = repository.findAllByEndpoint(ep.trim());
                    if (!subs.isEmpty()) {
                        map.put(ep.trim(), subs.get(0));
                    }
                }
            }
            return map;
        }

        // 2. Direct student emails provided
        if (criteria.getStudentEmails() != null && !criteria.getStudentEmails().isEmpty()) {
            List<PushSubscription> subs = repository.findByUserEmailIn(criteria.getStudentEmails());
            for (PushSubscription s : subs) {
                map.put(s.getEndpoint().trim(), s);
            }
            return map;
        }

        // 3. Criteria Filtering (Department, Years, Divisions, Batches, Roles)
        String dept = criteria.getDepartment();
        List<String> years = criteria.getAcademicYears() != null ? criteria.getAcademicYears() : Collections.emptyList();
        List<String> divs = criteria.getDivisions() != null ? criteria.getDivisions() : Collections.emptyList();
        List<String> batches = criteria.getBatches() != null ? criteria.getBatches() : Collections.emptyList();
        List<String> roles = criteria.getRoles() != null ? criteria.getRoles() : Collections.emptyList();

        boolean isGlobal = (dept == null || "ALL".equalsIgnoreCase(dept)) &&
            years.isEmpty() && divs.isEmpty() && batches.isEmpty() && roles.isEmpty();

        if (isGlobal) {
            for (PushSubscription s : repository.findAll()) {
                map.put(s.getEndpoint().trim(), s);
            }
            return map;
        }

        Set<String> matchedEmails = new HashSet<>();

        boolean includeStudents = roles.isEmpty() || roles.stream().anyMatch(r -> r.equalsIgnoreCase("STUDENT") || r.equalsIgnoreCase("STUDENTS"));
        boolean includeFaculty = roles.isEmpty() || roles.stream().anyMatch(r -> r.equalsIgnoreCase("FACULTY") || r.equalsIgnoreCase("HOD") || r.equalsIgnoreCase("TEACHER"));

        if (includeStudents) {
            List<Student> students = (dept != null && !"ALL".equalsIgnoreCase(dept))
                ? studentRepository.findByDepartment(dept)
                : studentRepository.findAll();

            for (Student s : students) {
                boolean yearMatch = years.isEmpty() || years.stream().anyMatch(y -> y.equalsIgnoreCase("ALL") || (s.getAcademicYear() != null && s.getAcademicYear().equalsIgnoreCase(y)));
                boolean divMatch = divs.isEmpty() || divs.stream().anyMatch(dv -> dv.equalsIgnoreCase("ALL") || (s.getDivision() != null && s.getDivision().toLowerCase().contains(dv.toLowerCase().replace("div", "").trim())));
                boolean batchMatch = batches.isEmpty() || batches.stream().anyMatch(b -> b.equalsIgnoreCase("ALL") || (s.getBatchGroup() != null && s.getBatchGroup().toLowerCase().contains(b.toLowerCase().replace("batch", "").trim())));

                if (yearMatch && divMatch && batchMatch && s.getEmail() != null) {
                    matchedEmails.add(s.getEmail().trim().toLowerCase());
                }
            }
        }

        if (includeFaculty) {
            List<User> users = (dept != null && !"ALL".equalsIgnoreCase(dept))
                ? userRepository.findByDepartment(dept)
                : userRepository.findAll();

            for (User u : users) {
                if ("FACULTY".equalsIgnoreCase(u.getRole()) || "HOD".equalsIgnoreCase(u.getRole())) {
                    if (u.getEmail() != null) {
                        matchedEmails.add(u.getEmail().trim().toLowerCase());
                    }
                }
            }
        }

        if (!matchedEmails.isEmpty()) {
            List<PushSubscription> subs = repository.findByUserEmailIn(new ArrayList<>(matchedEmails));
            for (PushSubscription s : subs) {
                map.put(s.getEndpoint().trim(), s);
            }
        }

        return map;
    }

    public List<DeviceNoticeDelivery> getNoticeDeliveries(Long noticeId) {
        return deliveryRepository.findByNoticeId(noticeId);
    }

    public void sendPushNotificationToAll(String title, String message) {
        List<PushSubscription> subscriptions = repository.findAll();
        sendNotificationToSubscriptions(subscriptions, title, message);
    }

    public void sendPushNotificationToUsers(List<String> targetEmails, String title, String message) {
        if (targetEmails == null || targetEmails.isEmpty()) return;
        List<PushSubscription> subscriptions = repository.findByUserEmailIn(targetEmails);
        sendNotificationToSubscriptions(subscriptions, title, message);
    }

    private void sendNotificationToSubscriptions(List<PushSubscription> subscriptions, String title, String message) {
        if (subscriptions == null || subscriptions.isEmpty()) return;

        String safeTitle = title != null ? title.replace("\"", "\\\"").replace("\n", " ") : "Faculty Notification";
        String safeMessage = message != null ? message.replace("\"", "\\\"").replace("\n", " ") : "You have a new update.";
        String payload = String.format("{\"title\":\"%s\", \"message\":\"%s\"}", safeTitle, safeMessage);

        // Deduplicate in memory before sending to ensure 1 push per unique device
        Map<String, PushSubscription> uniqueMap = new LinkedHashMap<>();
        for (PushSubscription sub : subscriptions) {
            if (sub.getEndpoint() != null) {
                uniqueMap.put(sub.getEndpoint().trim(), sub);
            }
        }

        for (PushSubscription sub : uniqueMap.values()) {
            try {
                Subscription.Keys keys = new Subscription.Keys(sub.getP256dh(), sub.getAuth());
                Subscription subscription = new Subscription(sub.getEndpoint(), keys);
                Notification notification = new Notification(subscription, payload);
                if (pushService != null) {
                    pushService.send(notification);
                }
            } catch (Exception e) {
                log.warn("Failed to send push notification to {}: {}", sub.getEndpoint(), e.getMessage());
            }
        }
    }

    protected boolean dispatchWebPush(PushSubscription sub, String payload) {
        if (pushService == null) {
            return true;
        }
        try {
            if (sub.getP256dh() != null && !sub.getP256dh().isEmpty() && sub.getAuth() != null && !sub.getAuth().isEmpty()) {
                Subscription.Keys keys = new Subscription.Keys(sub.getP256dh(), sub.getAuth());
                Subscription subscription = new Subscription(sub.getEndpoint(), keys);
                Notification notification = new Notification(subscription, payload);
                pushService.send(notification);
            }
            return true;
        } catch (Exception e) {
            log.warn("Web Push transmission to {} resulted in: {}", sub.getEndpoint(), e.getMessage());
            return false;
        }
    }

    private String getDeviceTypeFromEndpoint(String endpoint) {
        if (endpoint == null) return "Web Browser";
        String ep = endpoint.toLowerCase();
        if (ep.contains("fcm.googleapis.com") || ep.contains("google")) return "Chrome / Android";
        if (ep.contains("mozilla") || ep.contains("firefox")) return "Mozilla Firefox";
        if (ep.contains("apple") || ep.contains("safari")) return "Apple Safari";
        if (ep.contains("windows") || ep.contains("edge")) return "Microsoft Edge";
        return "Web Browser";
    }
}
