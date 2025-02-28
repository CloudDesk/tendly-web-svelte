Requirement

Section 80C: Deduction for Investment in Specified Savings Instruments
* Subsections:
   * 80C (Life Insurance Premium): Premium paid for life insurance policies for self, spouse, children
   * 80C (Employee Provident Fund - EPF)
   * 80C (Public Provident Fund - PPF)
   * 80C (National Savings Certificate - NSC)
   * 80C (Tax-saving Fixed Deposit - FD)
   * 80C (5-year fixed deposit with post office)
   * 80C (Senior Citizens Savings Scheme - SCSS)
   * 80C (National Pension Scheme - NPS)
* Max Limit: ₹1.5 lakh
Section 80D: Deduction for Premium Paid on Health Insurance
* Subsections:
   * 80D (Health Insurance for self, spouse, children): Premium paid for health insurance for self, spouse, children
   * 80D (Health Insurance for Parents): Premium paid for parents' health insurance
* Max Limit:
   * ₹25,000 (for self, spouse, children)
   * ₹50,000 (for senior citizens)
Section 80E: Deduction for Interest on Education Loan
* Subsections:
   * 80E (Education Loan): Interest on loans for higher education (for self, spouse, children, or a student for whom you are a legal guardian)
* Max Limit: No limit on interest amount; available for up to 8 years
Section 80G: Deduction for Donations to Charitable Institutions
* Subsections:
   * 80G (Donation to Charitable Institutions): Donations made to approved charitable institutions or relief funds
* Max Limit:
   * 50% or 100% of the donation (depending on the institution)
Section 80TTA: Deduction for Interest on Savings Account
* Subsections:
   * 80TTA (Interest on Savings Account): Interest earned from savings accounts with banks, post offices, or co-operative societies
* Max Limit: ₹10,000
Section 80GG: Deduction for Rent Paid
* Subsections:
   * 80GG (Rent Paid): Deduction available when HRA is not received and rent is paid for accommodation
* Max Limit: ₹5,000 per month or 25% of total income (whichever is lower)
Section 80CCG: Deduction for Investment in Rajiv Gandhi Equity Savings Scheme
* Subsections:
   * 80CCG (Investment in RGESS): Investment made under Rajiv Gandhi Equity Savings Scheme (for first-time retail investors)
* Max Limit: ₹25,000
Section 80U: Deduction for Persons with Disabilities
* Subsections:
   * 80U (Persons with Disabilities): Deduction for individuals with disabilities (requires disability certificate)
* Max Limit:
   * ₹75,000 (normal disability)
   * ₹1.25 lakh (severe disability)
Section 80RRB: Deduction for Income from Patents
* Subsections:
   * 80RRB (Income from Patents): Income from patents held by the taxpayer
* Max Limit: ₹3 lakh
Section 80DDB: Deduction for Medical Treatment of Specified Diseases
* Subsections:
   * 80DDB (Medical Treatment): Deduction for medical treatment of specified diseases (e.g., cancer, neurological diseases)
* Max Limit:
   * ₹40,000 (general)
   * ₹1 lakh (for senior citizens)
Section 80CCD(1): Deduction for Contributions to National Pension Scheme (NPS)
* Subsections:
   * 80CCD(1) (Employee’s Contribution to NPS): Employee’s own contribution to NPS
* Max Limit: ₹1.5 lakh (under Section 80C limit)
Section 80CCD(2): Deduction for Employer's Contribution to NPS
* Subsections:
   * 80CCD(2) (Employer’s Contribution to NPS): Employer’s contribution to NPS
* Max Limit: 10% of salary (no upper limit)
Section 10(14): Allowances
* Subsections:
   * 10(14) (House Rent Allowance - HRA): Allowance given as part of salary for rent paid
   * 10(14) (Special Allowance for children, transport, etc.): Allowances like transport or child education allowances
* Max Limit: Depends on salary structure and actual expense incurred
Section 24(b): Deduction on Home Loan Interest
* Subsections:
   * 24(b) (Interest on Home Loan): Deduction on the interest paid on home loan for self-occupied or let-out property
* Max Limit: ₹2 lakh (for self-occupied property)


 const deductionSections = [
    {
      id: "80C",
      title: "Section 80C",
      description: "Deduction for Investment in Specified Savings Instruments",
      maxLimit: 150000,
      subsections: [
        { id: "life_insurance", name: "Life Insurance Premium" },
        { id: "epf", name: "Employee Provident Fund (EPF)" },
        { id: "ppf", name: "Public Provident Fund (PPF)" },
        { id: "nsc", name: "National Savings Certificate (NSC)" },
        { id: "tax_saving_fd", name: "Tax-saving Fixed Deposit (FD)" },
        { id: "post_office_fd", name: "5-year fixed deposit with post office" },
        { id: "scss", name: "Senior Citizens Savings Scheme (SCSS)" },
        { id: "nps_80c", name: "National Pension Scheme (NPS)" },
      ],
    },
    {
      id: "80D",
      title: "Section 80D",
      description: "Deduction for Premium Paid on Health Insurance",
      maxLimit: null,
      subsections: [
        {
          id: "self_family",
          name: "Health Insurance for self, spouse, children",
          maxLimit: 25000,
        },
        {
          id: "parents",
          name: "Health Insurance for Parents",
          maxLimit: 50000,
          note: "For senior citizen parents",
        },
      ],
    },
 {
      id: "80E",
      title: "Section 80E",
      description: "Deduction for Interest on Education Loan",
      maxLimit: null, // No limit, but for 8 years
      subsections: [
        {
          id: "education_loan",
          name: "Education Loan Interest",
          note: "Available for up to 8 years",
        },
      ],
    },
    {
      id: "80G",
      title: "Section 80G",
      description: "Deduction for Donations to Charitable Institutions",
      maxLimit: null, // Depends on institution
      subsections: [
        {
          id: "donations",
          name: "Donation to Charitable Institutions",
          note: "50% or 100% depending on institution",
        },
      ],
    },
    {
      id: "80TTA",
      title: "Section 80TTA",
      description: "Deduction for Interest on Savings Account",
      maxLimit: 10000,
      subsections: [
        { id: "savings_interest", name: "Interest on Savings Account" },
      ],
    },
    {
      id: "80GG",
      title: "Section 80GG",
      description: "Deduction for Rent Paid",
      maxLimit: null, // Dynamic: ₹60,000 or 25% of income
      subsections: [
        {
          id: "rent_paid",
          name: "Rent Paid",
          note: "When HRA is not received",
        },
      ],
    },
    {
      id: "80CCG",
      title: "Section 80CCG",
      description:
        "Deduction for Investment in Rajiv Gandhi Equity Savings Scheme",
      maxLimit: 25000,
      subsections: [
        {
          id: "rgess",
          name: "Investment in RGESS",
          note: "For first-time retail investors",
        },
      ],
    },
    {
      id: "80U",
      title: "Section 80U",
      description: "Deduction for Persons with Disabilities",
      maxLimit: 125000, // Max for severe disability
      subsections: [
        {
          id: "disability",
          name: "Persons with Disabilities",
          note: "₹75,000 for normal disability, ₹1.25 lakh for severe disability",
        },
      ],
    },
    {
      id: "80RRB",
      title: "Section 80RRB",
      description: "Deduction for Income from Patents",
      maxLimit: 300000,
      subsections: [{ id: "patents", name: "Income from Patents" }],
    },
    {
      id: "80DDB",
      title: "Section 80DDB",
      description: "Deduction for Medical Treatment of Specified Diseases",
      maxLimit: 100000, // Max for senior citizens
      subsections: [
        {
          id: "medical_treatment",
          name: "Medical Treatment",
          note: "₹40,000 general, ₹1 lakh for senior citizens",
        },
      ],
    },
    {
      id: "80CCD1",
      title: "Section 80CCD(1)",
      description:
        "Deduction for Contributions to National Pension Scheme (NPS)",
      maxLimit: 150000, // Under 80C limit
      subsections: [
        { id: "employee_nps", name: "Employee's Contribution to NPS" },
      ],
    },
    {
      id: "80CCD2",
      title: "Section 80CCD(2)",
      description: "Deduction for Employer's Contribution to NPS",
      maxLimit: null, // Dynamic: 10% of salary
      subsections: [
        {
          id: "employer_nps",
          name: "Employer's Contribution to NPS",
          note: "10% of salary",
        },
      ],
    },
    {
      id: "10_14",
      title: "Section 10(14)",
      description: "Allowances",
      maxLimit: null, // Depends on actual expense
      subsections: [
        { id: "hra", name: "House Rent Allowance (HRA)" },
        {
          id: "special_allowance",
          name: "Special Allowance for children, transport, etc.",
        },
      ],
    },
    {
      id: "24b",
      title: "Section 24(b)",
      description: "Deduction on Home Loan Interest",
      maxLimit: 200000, // For self-occupied property
      subsections: [
        {
          id: "home_loan_interest",
          name: "Interest on Home Loan",
          note: "For self-occupied property",
        },
      ],
    },
 ]