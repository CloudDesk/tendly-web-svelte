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

export type filterOption = {
    label: string;
    value: string | number;
};

export type filterSchema = {
    key: string;
    label: string;
    type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text' | 'checkbox';
    options?: filterOption[];
    description?: string;
    disabled?:boolean
};