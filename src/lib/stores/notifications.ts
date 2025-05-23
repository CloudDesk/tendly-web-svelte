import { writable } from 'svelte/store';

export interface NotificationData {
    id: string;
    title: string;
    body: string;
    timestamp: number;
}

export const notifications = writable<NotificationData[]>([]);

export function addNotification(title: string, body: string) {
    const notification: NotificationData = {
        id: crypto.randomUUID(),
        title,
        body,
        timestamp: Date.now()
    };

    notifications.update(n => [...n, notification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        notifications.update(n => n.filter(notif => notif.id !== notification.id));
    }, 5000);
}