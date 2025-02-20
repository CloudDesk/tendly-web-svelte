export type SalaryAssignment = {
    monthlyGross: Number;
    monthlyInsurance: Number;
    reimbursement: Number;
    salaryStructureId: String;
    employeeId: String;
    isActive: Boolean;
    effectiveFrom: Date;
    effectiveTo: Date;
    _id?: String;
}