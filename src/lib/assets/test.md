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


TaxSlab (TaxSlabSchema):

This schema is essential for defining various tax regimes and the financial year-specific tax slabs, cess rates, and standard deductions.
Ensure that it accommodates different regimes (e.g., old and new tax regimes in India) if applicable.

TaxDeclaratio`n (TaxDeclarationSchema):

This schema should capture the employee's choices regarding tax regimes and deductions, which are fundamental to accurate tax calculations.
Consider including fields for various deductions, exemptions, and any other specifics related to the employee's declarations.

MonthlyTax (MonthlyTaxCalculationSchema):

This schema focuses on calculating the monthly tax based on the user's declarations and applicable tax slabs.
Ensure that it integrates well with the TaxDeclaration schema to pull in the necessary data for calculations.

Payslip:

Although this is not yet started, it will be important for summarizing the employee's earnings, deductions, and net pay.
When developing this, make sure to refer back to the MonthlyTax schema, attendance, and salary assignments to provide accurate payroll information.


TaxSlab  
   └── Provides tax information to ──> TaxDeclaration  
                              └── Declared data used by ──> MonthlyTax  
                                                        └── Monthly tax calculations included in ──> Payslip
                                                        