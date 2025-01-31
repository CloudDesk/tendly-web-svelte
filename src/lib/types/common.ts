export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ToastMessage = {
    id: string;
    type: ToastType;
    message: string;
    duration: number;
}

export type DialogConfig = {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'warning' | 'danger';
};