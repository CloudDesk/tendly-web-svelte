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

## 3. **Employee Salary Breakup**

### Table: `employee_salary_breakups`
| Field                  | Type       | Description                                     |
|------------------------|------------|-------------------------------------------------|
| `_id`                  | ObjectId   | Primary Key                                      |
| `employee_id`          | ObjectId   | Reference to Users Collection                    |
| `employee_salary_id`   | ObjectId   | Reference to Employee Salaries Collection         |
| `month`                | Number     | Month of Salary Breakup (1 to 12)                |
| `year`                 | Number     | Year of Salary Breakup                           |
| `basic`                | Number     | Calculated Basic Salary                          |
| `hra`                  | Number     | Calculated HRA                                   |
| `allowance`            | Number     | Calculated Allowances                            |
| `gross`                | Number     | Gross Salary                                     |
| `epf_employee`         | Number     | Employee EPF Contribution                        |
| `esi_employee`         | Number     | Employee ESI Contribution                        |
| `epf_employer`         | Number     | Employer EPF Contribution                        |
| `professional_tax`     | Number     | Professional Tax Deduction                       |
| `income_tax`           | Number     | Income Tax Deduction                             |
| `net_salary`           | Number     | Net Salary after all deductions                  |
| `created_at`           | Date       | Record Creation Date                             |
| `updated_at`           | Date       | Record Last Update Date                          |

---

## 4. **Employee Income Tax**

### Table: `employee_income_taxes`
| Field                  | Type       | Description                                     |
|------------------------|------------|-------------------------------------------------|
| `_id`                  | ObjectId   | Primary Key                                      |
| `employee_id`          | ObjectId   | Reference to Users Collection                    |
| `regime`               | String     | Tax Regime Selected (Old/New)                    |
| `declared_investments` | Number     | Amount Declared for Tax Savings                  |
| `annual_gross`         | Number     | Annual Gross Income                              |
| `total_taxable_income` | Number     | Total Taxable Income after Deductions             |
| `total_tax`            | Number     | Calculated Total Tax Amount                      |
| `cess`                 | Number     | 4% Cess on Total Tax Amount                      |
| `total_payable`        | Number     | Total Tax Payable                                |
| `month`                | Number     | Month of Tax Calculation                         |
| `created_at`           | Date       | Record Creation Date                             |
| `updated_at`           | Date       | Record Last Update Date                          |

---

## 5. **Insurance**

### Table: `insurances`
| Field                  | Type       | Description                                     |
|------------------------|------------|-------------------------------------------------|
| `_id`                  | ObjectId   | Primary Key                                      |
| `provider`             | String     | Insurance Provider Name                          |
| `type`                 | String     | Type of Insurance (Health, Life, Accidental)      |
| `coverage_amount`      | Number     | Maximum Coverage Amount                          |
| `premium_amount`       | Number     | Premium Amount per Term                          |
| `term`                 | String     | Premium Term (Monthly, Yearly)                   |
| `created_at`           | Date       | Record Creation Date                             |
| `updated_at`           | Date       | Record Last Update Date                          |

---

## 6. **Employee Insurances**

### Table: `employee_insurances`
| Field                  | Type       | Description                                     |
|------------------------|------------|-------------------------------------------------|
| `_id`                  | ObjectId   | Primary Key                                      |
| `employee_id`          | ObjectId   | Reference to Users Collection                    |
| `insurance_id`         | ObjectId   | Reference to Insurances Collection                |
| `policy_number`        | String     | Policy Number Issued by Provider                  |
| `premium_amount`       | Number     | Premium Paid by Employee                         |
| `employer_contribution`| Number     | Employer Contribution towards Premium             |
| `effective_date`       | Date       | Policy Effective Date                            |
| `expiry_date`          | Date       | Policy Expiry Date                               |
| `active`               | Boolean    | Policy Status (Active/Inactive)                  |
| `dependents`           | Array      | List of Dependents Covered                       |
| `created_at`           | Date       | Record Creation Date                             |
| `updated_at`           | Date       | Record Last Update Date                          |

---

## **Relationships:**
1. **Salary Structure:**
   - `employee_salaries.salary_structure_id` → `salary_structures._id`

2. **Employee Salary Breakup:**
   - `employee_salary_breakups.employee_salary_id` → `employee_salaries._id`

3. **Employee Income Tax:**
   - `employee_income_taxes.employee_id` → `users._id`

4. **Insurance:**
   - `employee_insurances.insurance_id` → `insurances._id`

5. **Employee Insurances:**
   - `employee_insurances.employee_id` → `users._id`

---

## **Benefits of this Design:**
- **Scalable:** Supports multiple salary structures, insurances, and tax regimes.
- **Maintainable:** Modular approach makes it easy to update or extend.
- **Efficient Reporting:** Facilitates comprehensive salary, tax, and insurance reports.
