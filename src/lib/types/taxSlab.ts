

export type TaxSlab = {
    regime: "old" | "new";
    financialYear: string;
    slabs:
    {
        fromAmount: number;
        toAmount?: number | null; // Null for highest slab
        taxRate: number; // In percentage
    }[];
    cessRate: number; // In percentage
    standardDeduction: number;
    isActive: boolean;
    _id?: string;
}