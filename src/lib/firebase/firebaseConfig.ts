import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// const firebaseConfig = {
//     apiKey: "AIzaSyBPfDz4iHUWjYWojHHdtqT1MW37UG6QqBI",
//     authDomain: "tendly-web.firebaseapp.com",
//     projectId: "tendly-web",
//     storageBucket: "tendly-web.firebasestorage.app",
//     messagingSenderId: "681549896685",
//     appId: "1:681549896685:web:b213aceff2b7cd2a17e5e4"
//   };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const FirebaseAuth = getAuth(app);

// Initialize Firebase Messaging only if supported
let messaging: any = null;

export async function initializeMessaging() {
  if (typeof window === "undefined") {
    console.log("Window is undefined, skipping FCM initialization");
    return null;
  }

  try {
    const supported = await isSupported();
    if (supported) {
      console.log("FCM is supported");
      messaging = getMessaging(app);
      return messaging;
    } else {
      console.log("FCM is not supported in this browser");
      return null;
    }
  } catch (error) {
    console.error("Error checking FCM support:", error);
    return null;
  }
}

export const getMessagingInstance = () => messaging;