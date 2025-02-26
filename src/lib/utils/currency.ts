
export function formatCurrency(amount: number | null | undefined): string {
    // Convert null/undefined to 0, ensure we have a valid number
    const value = Number.isFinite(amount) ? amount as number : 0;

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);
}
