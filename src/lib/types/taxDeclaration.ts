
export interface ISlabwiseTax {
    slab: string;
    amount: number;
    fromAmount: number;
    toAmount?: number | null;
}

export interface ITaxBreakdown {
    taxAmount: number;
    slabwiseTax: ISlabwiseTax[];
    cessAmount: number;
    totalTaxAmount: number;
    taxableIncome: number;
}
export interface IDocument {
    documentName: string;
    documentPath: string;
    uploadData: string;
    isLatestVersion: boolean;
}

export interface IDeclaration {
    sectionId: string;
    section: string;
    subSectionId: string;
    subSection: string;
    maxLimit: number;
    description: string;
    declaredAmount: number;
    varifiedAmount: number;
    status: "pending" | "verified" | "rejected" | "resubmission_requested";
    documents: IDocument[];
    reviewHistory: {
        reviewedBy: string;
        reviewDate: string;
        status: "verified" | "rejected" | "resubmission_requested";
        comments: string;
    }[];
    lastUpdated: Date;
}

export type TaxDeclarationCreate = {
    employeeId: string;
    financialYear: string;
    regime: "old" | "new";
}
export type TaxDeclaration = {
    employeeId: string;
    financialYear: string;
    regime: "old" | "new";
    declarations?: IDeclaration[];
    cessRate: number;
    annualGross: number;
    totalDeclaredAmount: number;
    totalVerifiedAmount: number;
    standardDeduction: number;
    calculatedTaxAmount: number;
    revisedTaxAmount: number;
    taxPaid: number;
    taxAdjustmentRequired: boolean;
    adjustmentAmount: number;
    poiSubmissionStatus: "not_submitted" | "submitted" | "verified" | "rejected" | "resubmission";
    reviewHistory?: {
        reviewedBy: string;
        reviewDate: string;
        action: "verified" | "rejected" | "resubmission_requested";
        comments: string;
    }[];
    isLocked: boolean;
    initialTaxBreakdown: ITaxBreakdown;
    isDeclared?: boolean;
    isPOISubmitted?: boolean,
    isResubmitted?: boolean,
    _id?: string;
    createdAt?: string;
    updatedAt?: string;
}
