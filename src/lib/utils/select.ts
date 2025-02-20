export interface SelectOption {
    value: string | number;
    label: string;
}

export function getSelectLabel(
    value: string | number | null | undefined,
    options: SelectOption[] | undefined
): string | null {
    if (!value || !options?.length) return null;

    const option = options.find(opt => opt.value === value);
    return option?.label || value.toString() || null;
}