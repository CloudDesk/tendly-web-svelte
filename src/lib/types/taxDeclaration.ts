
export interface ISlabwiseTax {
    slab: string;
    amount: number;
    fromAmount: number;
    toAmount?: number | null;
}

export interface ITaxBreakdown {
    taxAmount: number; //SBT
    slabwiseTax: ISlabwiseTax[];
    cessAmount: number;
    totalTaxAmount: number; //taxAmount after the rebate/relief
    taxableIncome: number;
    rebateAmount: number; // Added for Rebate 87A(a)
    isRebateApplicable: boolean; // Flag for rebate eligibility
    marginalReliefAmount: number; // Added for Marginal Relief 87A(b)
    isMarginalReliefApplicable: boolean; // Flag for marginal relief eligibility
    finalTaxWithCess: number; // Final tax after rebate/relief and cess
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
    verifiedAmount: number;
    status: "pending" | "verified" | "rejected" | "resubmission_requested" | "document_submitted";
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

    form12B: string, //{ type: Schema.Types.ObjectId, ref: 'Form12B' }
    salaryAssignments: {
        assignmentId:string, //{ type: Schema.Types.ObjectId, ref: 'SalaryAssignment' },
        validFrom: string, //{ type: Date, required: true },
        validTill: string, //{ type: Date, required: true },
        monthlyGross: number, //{ type: Number, required: true },
        isActive: boolean, //{ type: Boolean, default: false }
    }[],
    isForm12BApplicable: boolean, //{ type: Boolean, default: false }

    _id?: string;
    createdAt?: string;
    updatedAt?: string;
}
