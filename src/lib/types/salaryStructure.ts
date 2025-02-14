export type salaryStructure = {
    _id: string
    name: string;
    fixedEarnings: {
        basicPercentage: number;
        hraPercentage: number;
        daPercentage: number;
        otherAllowancePercentage: number;
    };
    statutoryDeductions: {
        epf: {
            employeeContribution: number;
            employerContribution: number;
            maxLimit: number;
        };
        esi: {
            employeeContribution: number;
            employerContribution: number;
            applicabilityLimit: number;
        };
        professionalTax: {
            state: string;
            slabs: {
                range: string;
                amount: number;
            }[];
        };
    };
}