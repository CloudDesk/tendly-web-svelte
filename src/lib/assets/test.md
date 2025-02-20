# Data Model Flow for HRMS - Salary and Insurance Management

---

## 1. **Salary Structure**

### Table: `salary_structures`
| Field              | Type       | Description                                     |
|-------------------|------------|-------------------------------------------------|
| `_id`              | ObjectId   | Primary Key                                      |
| `name`             | String     | Name of the Salary Structure                     |
| `hra`              | Number     | Percentage of HRA from Gross                     |
| `basic`            | Number     | Percentage of Basic Salary from Gross             |
| `allowance`        | Number     | Percentage of Other Allowances from Gross         |
| `da`               | Number     | Percentage of Dearness Allowance                  |
| `professional_tax` | Array      | Professional Tax Slabs (JSON Array)               |
| `epf`              | Object     | EPF Details (employer: 12%, employee: 12%)        |
| `esi`              | Object     | ESI Details (employer: 0.75%, employee: 3.25%)    |
| `created_at`       | Date       | Record Creation Date                             |
| `updated_at`       | Date       | Record Last Update Date                          |

---

## 2. **Employee Salary**

### Table: `employee_salaries`
| Field                  | Type       | Description                                     |
|------------------------|------------|-------------------------------------------------|
| `_id`                  | ObjectId   | Primary Key                                      |
| `employee_id`          | ObjectId   | Reference to Users Collection                    |
| `salary_structure_id`  | ObjectId   | Reference to Salary Structures Collection         |
| `monthly_gross`        | Number     | Monthly Gross Salary                             |
| `reimbursement`        | Number     | Reimbursement Amount                             |
| `monthly_insurance`    | Number     | Monthly Insurance Premium                        |
| `is_active`            | Boolean    | Active Status of Salary Structure                 |
| `effective_from`       | Date       | Salary Effective Start Date                      |
| `effective_to`         | Date       | Salary Effective End Date                        |
| `created_at`           | Date       | Record Creation Date                             |
| `updated_at`           | Date       | Record Last Update Date                          |

---

// Types for better type safety
type TaxRegime = 'OLD' | 'NEW';
type ProofStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESUBMISSION_REQUESTED' | 'RESUBMITTED';
type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'RESUBMISSION_REQUESTED';

import { Schema, model, Document, Types } from 'mongoose';

// Employee Schema
interface IEmployee extends Document {
  employeeId: string;
  name: string;
  dateOfJoining: Date;
  state: string;
  selectedTaxRegime: TaxRegime;
  currentSalaryAssignment: Types.ObjectId;
}

const EmployeeSchema = new Schema<IEmployee>({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  dateOfJoining: { type: Date, required: true },
  state: { type: String, required: true },
  selectedTaxRegime: { 
    type: String,
    enum: ['OLD', 'NEW'],
    required: true 
  },
  currentSalaryAssignment: { 
    type: Schema.Types.ObjectId, 
    ref: 'SalaryAssignment' 
  }
});

// Salary Structure Schema
interface ISalaryStructure extends Document {
  name: string;
  components: {
    basic: number;
    hra: number;
    specialAllowance: number;
  };
  statutoryDeductions: {
    professionalTax: {
      stateWiseSlabs: [{
        state: string;
        slabs: [{
          min: number;
          max: number;
          amount: number;
        }];
      }];
    };
    epf: {
      employeeContribution: number;
      employerContribution: number;
    };
    esi: {
      employeeContribution: number;
      employerContribution: number;
    };
  };
}

const SalaryStructureSchema = new Schema<ISalaryStructure>({
  name: { type: String, required: true },
  components: {
    basic: { type: Number, required: true }, // Percentage of gross
    hra: { type: Number, required: true },
    specialAllowance: { type: Number, required: true }
  },
  statutoryDeductions: {
    professionalTax: {
      stateWiseSlabs: [{
        state: String,
        slabs: [{
          min: Number,
          max: Number,
          amount: Number
        }]
      }]
    },
    epf: {
      employeeContribution: Number,
      employerContribution: Number
    },
    esi: {
      employeeContribution: Number,
      employerContribution: Number
    }
  }
});

// Tax Declaration Schema
interface ITaxDeclaration extends Document {
  employee: Types.ObjectId;
  financialYear: string;
  regime: TaxRegime;
  declarations: [{
    section: string;
    subSection: string;
    declaredAmount: number;
    proofStatus: ProofStatus;
    verifiedAmount: number;
    documents: [{
      documentType: string;
      uploadedAt: Date;
      status: DocumentStatus;
      remarks: string;
      fileReference: string;
    }];
    resubmissionAllowed: boolean;
    resubmissionDeadline?: Date;
  }];
  totalDeclaredAmount: number;
  totalVerifiedAmount: number;
  lastModifiedAt: Date;
}

const TaxDeclarationSchema = new Schema<ITaxDeclaration>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  financialYear: { type: String, required: true },
  regime: { 
    type: String, 
    enum: ['OLD', 'NEW'], 
    required: true 
  },
  declarations: [{
    section: { type: String, required: true },
    subSection: { type: String, required: true },
    declaredAmount: { type: Number, required: true },
    proofStatus: { 
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'RESUBMISSION_REQUESTED', 'RESUBMITTED'],
      default: 'PENDING'
    },
    verifiedAmount: { type: Number, default: 0 },
    documents: [{
      documentType: String,
      uploadedAt: Date,
      status: { 
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED', 'RESUBMISSION_REQUESTED'],
        default: 'PENDING'
      },
      remarks: String,
      fileReference: String
    }],
    resubmissionAllowed: { type: Boolean, default: true },
    resubmissionDeadline: Date
  }],
  totalDeclaredAmount: { type: Number, default: 0 },
  totalVerifiedAmount: { type: Number, default: 0 },
  lastModifiedAt: { type: Date, default: Date.now }
});

// Monthly Tax Calculation Schema
interface IMonthlyTaxCalculation extends Document {
  employee: Types.ObjectId;
  financialYear: string;
  month: number;
  grossSalary: number;
  standardDeduction: number;
  declaredDeductions: number;
  verifiedDeductions: number;
  taxableIncome: number;
  calculatedTax: number;
  cessAmount: number;
  adjustments: {
    amount: number;
    reason: string;
    appliedFrom: Date;
    appliedTo: Date;
  }[];
  finalTaxAmount: number;
}

const MonthlyTaxCalculationSchema = new Schema<IMonthlyTaxCalculation>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  financialYear: { type: String, required: true },
  month: { type: Number, required: true },
  grossSalary: { type: Number, required: true },
  standardDeduction: { type: Number, required: true },
  declaredDeductions: { type: Number, required: true },
  verifiedDeductions: { type: Number, required: true },
  taxableIncome: { type: Number, required: true },
  calculatedTax: { type: Number, required: true },
  cessAmount: { type: Number, required: true },
  adjustments: [{
    amount: Number,
    reason: String,
    appliedFrom: Date,
    appliedTo: Date
  }],
  finalTaxAmount: { type: Number, required: true }
});

// Salary Assignment Schema
interface ISalaryAssignment extends Document {
  employee: Types.ObjectId;
  salaryStructure: Types.ObjectId;
  effectiveFrom: Date;
  effectiveTo?: Date;
  monthlyGross: number;
  isActive: boolean;
}

const SalaryAssignmentSchema = new Schema<ISalaryAssignment>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  salaryStructure: { type: Schema.Types.ObjectId, ref: 'SalaryStructure', required: true },
  effectiveFrom: { type: Date, required: true },
  effectiveTo: Date,
  monthlyGross: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
});

// Export models
export const Employee = model<IEmployee>('Employee', EmployeeSchema);
export const SalaryStructure = model<ISalaryStructure>('SalaryStructure', SalaryStructureSchema);
export const TaxDeclaration = model<ITaxDeclaration>('TaxDeclaration', TaxDeclarationSchema);
export const MonthlyTaxCalculation = model<IMonthlyTaxCalculation>('MonthlyTaxCalculation', MonthlyTaxCalculationSchema);
export const SalaryAssignment = model<ISalaryAssignment>('SalaryAssignment', SalaryAssignmentSchema);



import { Schema, model, Document, Types } from 'mongoose';

interface IPayslip extends Document {
  employee: Types.ObjectId;
  salaryAssignment: Types.ObjectId;
  monthlyTaxCalculation: Types.ObjectId;
  month: number;
  year: number;
  payPeriod: {
    startDate: Date;
    endDate: Date;
  };
  earnings: {
    basic: number;
    hra: number;
    specialAllowance: number;
    otherAllowances: {
      name: string;
      amount: number;
    }[];
    totalEarnings: number;
  };
  deductions: {
    epf: {
      employeeContribution: number;
      employerContribution: number;
    };
    esi: {
      employeeContribution: number;
      employerContribution: number;
    };
    professionalTax: number;
    incomeTax: number;
    otherDeductions: {
      name: string;
      amount: number;
    }[];
    totalDeductions: number;
  };
  netSalary: number;
  paymentDetails: {
    bankName: string;
    accountNumber: string;
    paymentDate: Date;
    paymentStatus: 'PENDING' | 'PROCESSED' | 'FAILED';
    transactionReference?: string;
  };
  employerContributions: {
    epf: number;
    esi: number;
    gratuity?: number;
    others: {
      name: string;
      amount: number;
    }[];
    total: number;
  };
  leaveDetails: {
    paidLeaves: number;
    unpaidLeaves: number;
    totalWorkingDays: number;
    paidDays: number;
  };
  ctc: {
    monthly: number;
    annual: number;
  };
  status: 'DRAFT' | 'GENERATED' | 'APPROVED' | 'PAID';
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
}

const PayslipSchema = new Schema<IPayslip>({
  employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  salaryAssignment: { type: Schema.Types.ObjectId, ref: 'SalaryAssignment', required: true },
  monthlyTaxCalculation: { type: Schema.Types.ObjectId, ref: 'MonthlyTaxCalculation', required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  payPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  earnings: {
    basic: { type: Number, required: true },
    hra: { type: Number, required: true },
    specialAllowance: { type: Number, required: true },
    otherAllowances: [{
      name: { type: String, required: true },
      amount: { type: Number, required: true }
    }],
    totalEarnings: { type: Number, required: true }
  },
  deductions: {
    epf: {
      employeeContribution: { type: Number, required: true },
      employerContribution: { type: Number, required: true }
    },
    esi: {
      employeeContribution: { type: Number, required: true },
      employerContribution: { type: Number, required: true }
    },
    professionalTax: { type: Number, required: true },
    incomeTax: { type: Number, required: true },
    otherDeductions: [{
      name: { type: String, required: true },
      amount: { type: Number, required: true }
    }],
    totalDeductions: { type: Number, required: true }
  },
  netSalary: { type: Number, required: true },
  paymentDetails: {
    bankName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    paymentDate: { type: Date },
    paymentStatus: { 
      type: String, 
      enum: ['PENDING', 'PROCESSED', 'FAILED'],
      default: 'PENDING'
    },
    transactionReference: String
  },
  employerContributions: {
    epf: { type: Number, required: true },
    esi: { type: Number, required: true },
    gratuity: Number,
    others: [{
      name: { type: String, required: true },
      amount: { type: Number, required: true }
    }],
    total: { type: Number, required: true }
  },
  leaveDetails: {
    paidLeaves: { type: Number, required: true },
    unpaidLeaves: { type: Number, required: true },
    totalWorkingDays: { type: Number, required: true },
    paidDays: { type: Number, required: true }
  },
  ctc: {
    monthly: { type: Number, required: true },
    annual: { type: Number, required: true }
  },
  status: { 
    type: String,
    enum: ['DRAFT', 'GENERATED', 'APPROVED', 'PAID'],
    default: 'DRAFT'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
PayslipSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
PayslipSchema.index({ status: 1 });
PayslipSchema.index({ paymentDetails: { paymentStatus: 1 } });

// Virtual for full period representation
PayslipSchema.virtual('payPeriodString').get(function() {
  return `${this.payPeriod.startDate.toDateString()} - ${this.payPeriod.endDate.toDateString()}`;
});

export const Payslip = model<IPayslip>('Payslip', PayslipSchema);