import { getToken, onMessage } from "firebase/messaging";
import { initializeMessaging, getMessagingInstance } from "./firebaseConfig";

export const getFCMToken = async () => {
  let messaging = getMessagingInstance();

  // If messaging is not initialized, try to initialize it
  if (!messaging) {
    messaging = await initializeMessaging();
  }

  if (!messaging) {
    console.log("FCM not supported on this browser");
    return null;
  }

  try {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission denied");
      return null;
    }

    // Retrieve FCM token
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (currentToken) {
      console.log("FCM token:", currentToken);
      return currentToken;
    } else {
      console.log(
        "No FCM registration token available. Request permission to generate one."
      );
      return null;
    }
  } catch (error) {
    console.error("FCM token error:", error);
    return null;
  }
};

export function onMessageListener(callback: (payload: any) => void) {
  const messaging = getMessagingInstance();

  if (!messaging) {
    console.log("FCM not supported, skipping message listener");
    return;
  }

  // Handle foreground messages
  onMessage(messaging, (payload) => {
    console.log(" fcm Foreground Message:", payload);
    callback(payload);
  });
}