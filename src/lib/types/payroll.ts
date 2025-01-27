export type SalaryStructure = {
    userId: string;
    basic: number;
    hra: number;
    specialAllowance: number;
    conveyanceAllowance: number;
    medicalAllowance: number;
    lta: number;
    variablePay: number;
    effectiveFrom: string;
    effectiveTo: string | null;
    grossSalary: number;
    netSalary: number;
    ctc: number;
    pfDeduction: number;
    incomeTaxDeduction: number;
    pfEmployerContribution: number;
    gratuity: number;
    isActive: boolean;
    _id?: string;
}