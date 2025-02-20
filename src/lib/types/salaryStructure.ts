
export type SalaryStructure = {
    _id?: string
    name: string;
    fixedEarnings: IFixedEarnings;
    statutoryDeductions: IStatutoryDeductions;
    createdAt?: Date;
    updatedAt?: Date;
}

export type IFixedEarnings = {
    basicPercentage: number;
    hraPercentage: number;
    daPercentage: number;
    otherAllowancePercentage: number;
}

export type IStatutoryDeductions = {
    epf: IEPF;
    esi: IESI;
    professionalTax: IProfessionalTax;
}

export type IEPF = {
    employeeContribution: number;
    employerContribution: number;
    maxLimit: number;
}

export type IESI = {
    employeeContribution: number;
    employerContribution: number;
    applicabilityLimit: number;
}

export type IProfessionalTax = {
    state: string;
    term: string;
    slabs: IProfessionalTaxSlab[];
}

export interface IProfessionalTaxSlab {

    fromAmount: number;

    toAmount?: number | null;

    taxAmount: number;

    errors?: Record<string, string>;

}

export interface SalaryComponentsType {
    monthly: {
        gross: number;
        net: number;
        basic: number;
        hra: number;
        da: number;
        otherAllowance: number;
        deductions: {
            epf: number;
            esi: number;
            professionalTax: number;
            total: number;
        };
    };
    annual: {
        ctc: number;
        gross: number;
        net: number;
    };
    employerContributions: {
        epf: number;
        esi: number;
    };
}