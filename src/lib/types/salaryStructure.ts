
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

    toAmount?: number | undefined;

    taxAmount: number;

    errors?: Record<string, string>;

}
