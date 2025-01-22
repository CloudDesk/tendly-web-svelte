// src/lib/components/Toast/toast.store.ts
import type { ToastMessage } from '$lib/types';
import { writable } from 'svelte/store';


export const toastStore = writable<ToastMessage[]>([]);

const CONSTANTS = {
    DEFAULT_DURATION: 3000,
    MAX_TOASTS: 3
};

export const toast = {
    show: (message: string, type: ToastMessage['type'] = 'info', duration = CONSTANTS.DEFAULT_DURATION) => {
        const id = crypto.randomUUID();
        const newToast: ToastMessage = {
            id,
            type,
            message,
            duration
        };

        toastStore.update(toasts => {
            // Remove oldest toasts if we exceed MAX_TOASTS
            const updatedToasts = [...toasts, newToast];
            return updatedToasts.slice(-CONSTANTS.MAX_TOASTS);
        });

        // Auto-remove toast after duration
        setTimeout(() => {
            toastStore.update(toasts => toasts.filter(t => t.id !== id));
        }, duration);
    },

    // Convenience methods for different toast types
    success: (message: string, duration?: number) => toast.show(message, 'success', duration),
    error: (message: string, duration?: number) => toast.show(message, 'error', duration),
    info: (message: string, duration?: number) => toast.show(message, 'info', duration),
    warning: (message: string, duration?: number) => toast.show(message, 'warning', duration)
};
