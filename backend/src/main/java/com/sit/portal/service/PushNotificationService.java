package com.sit.portal.service;

import com.sit.portal.entity.PushSubscription;
import com.sit.portal.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.security.GeneralSecurityException;
import java.security.Security;
import java.util.List;

@Service
public class PushNotificationService {

    @Autowired
    private PushSubscriptionRepository repository;

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
            System.err.println("Error initializing PushService with VAPID keys: " + e.getMessage());
        }
    }

    public String getPublicKey() {
        return publicKey;
    }

    public void sendPushNotificationToAll(String title, String message) {
        List<PushSubscription> subscriptions = repository.findAll();
        
        String safeTitle = title != null ? title.replace("\"", "\\\"").replace("\n", " ") : "New Notice";
        String safeMessage = message != null ? message.replace("\"", "\\\"").replace("\n", " ") : "You have a new update.";
        String payload = String.format("{\"title\":\"%s\", \"message\":\"%s\"}", safeTitle, safeMessage);

        for (PushSubscription sub : subscriptions) {
            try {
                Subscription.Keys keys = new Subscription.Keys(sub.getP256dh(), sub.getAuth());
                Subscription subscription = new Subscription(sub.getEndpoint(), keys);
                Notification notification = new Notification(subscription, payload);
                pushService.send(notification);
            } catch (Exception e) {
                System.err.println("Failed to send push notification to " + sub.getEndpoint() + ": " + e.getMessage());
            }
        }
    }
}
