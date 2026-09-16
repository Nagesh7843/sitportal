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

    try {
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray
        });
      }

      if (subscription) {
        await apiService.subscribeToWebPush(subscription.toJSON()).catch(e => console.warn('Backend push sub sync warning:', e));
      }
    } catch (subErr) {
      console.warn('PushManager subscription warning (using local notifications):', subErr);
    }

    console.log('Web Push / Desktop notification device registered successfully.');
    return true;

  } catch (err) {
    console.error('Failed to register Web Push device:', err);
    // If standard Notification permission is granted, return true
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      return true;
    }
    return false;
  }
}

export async function isWebPushSubscribed(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}

export async function unsubscribeWebPushDevice(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await apiService.unsubscribeFromWebPush(endpoint).catch(() => {});
      console.log('Web Push device unsubscribed successfully.');
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to unsubscribe from Web Push:', err);
    return false;
  }
}
