export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ToastMessage = {
    id: string;
    type: ToastType;
    message: string;
    duration: number;
}
