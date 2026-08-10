import { apiService } from '@/services/api';

export async function registerWebPushDevice(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Web Push is not supported in this browser environment.');
    return false;
  }

  try {
    let permission = Notification.permission;
    if (permission === 'denied') {
      console.warn('Web Push notification permission was denied by user.');
      return false;
    }

    // Register Service Worker
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;
    }

    // Fetch VAPID key from backend
    const { publicKey } = await apiService.getVapidPublicKey();
    if (!publicKey) return false;

    // Convert URL-safe base64 string to Uint8Array
    const padding = '='.repeat((4 - (publicKey.length % 4)) % 4);
    const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      });
    }

    // Send to backend
    await apiService.subscribeToWebPush(subscription.toJSON());
    console.log('Web Push device registered successfully.');
    return true;

  } catch (err) {
    console.error('Failed to register Web Push device:', err);
    return false;
  }
}
