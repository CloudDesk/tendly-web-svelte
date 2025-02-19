
export type EmployeeSalary = {
    employeeId: string;
    salaryStructureId: number;
    monthlyGross: number;
    reimbursement: number;
    monthlyInsurance: number;
    isActive: boolean;
    effectiveFrom: Date;
    effectiveTo?: Date;
    _id?: string;
}