import { getToken, onMessage } from "firebase/messaging";
import { FirebaseMessaging } from "./firebaseConfig";

export const getFCMToken = async () => {
    if (!FirebaseMessaging) {
        console.log('FCM not supported on this browser');
        return null;
    }

    try {
        // Request permission first
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        const currentToken = await getToken(FirebaseMessaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY });
        if (currentToken) {
            console.log('FCM token:', currentToken);
            return currentToken;
        } else {
            console.log('FCM token: No registration token available. Request permission to generate one.');
            return null;
        }
    } catch (error) {
        console.log('FCM token error', error);
        return null;
    }
};


export function onMessageListener(callback: (payload: any) => void) {
    if (!FirebaseMessaging) {
        console.log('FCM not supported, skipping message listener');
        return;
    }

    // Handle foreground messages
    onMessage(FirebaseMessaging, (payload) => {
        console.log('Foreground Message:', payload);
        callback(payload);
    });
}