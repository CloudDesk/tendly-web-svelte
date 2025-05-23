importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Initialize the Firebase app in the service worker
try {
  firebase.initializeApp({
    apiKey: "AIzaSyBPfDz4iHUWjYWojHHdtqT1MW37UG6QqBI",
    authDomain: "tendly-web.firebaseapp.com",
    projectId: "tendly-web",
    storageBucket: "tendly-web.firebasestorage.app",
    messagingSenderId: "681549896685",
    appId: "1:681549896685:web:b213aceff2b7cd2a17e5e4",
  });

  const messaging = firebase.messaging();
  console.log("[firebase-messaging-sw.js] Service worker initialized");

  messaging.onBackgroundMessage((payload) => {
    console.log(
      "[firebase-messaging-sw.js] Received background message:",
      payload
    );
    const notificationTitle =
      payload.notification?.title || "Background Message";
    const notificationOptions = {
      body: payload.notification?.body || "You have a new message!",
      icon: "/favicon.png",
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.error("[firebase-messaging-sw.js] Error initializing:", error);
}
