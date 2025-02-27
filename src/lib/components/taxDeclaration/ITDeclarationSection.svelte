<script lang="ts">
  import { onMount } from "svelte";
  import { formatCurrency } from "$lib/utils/currency";
  import type { TaxDeclaration } from "$lib/types";

  export let taxDeclaration: TaxDeclaration;

  // Define deduction sections data structure
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
      maxLimit: 60000,
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
      maxLimit: null, // 10% of salary, no upper limit
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
  ];

  // Get declarations by section
  const getDeclarationsBySection = (section) => {
    console.log(section, "getDeclarationsBySection");
    if (!taxDeclaration || !taxDeclaration.declarations) return [];
    return taxDeclaration.declarations.filter((d) => d.section === section);
  };

  // Get declaration by section and subsection
  const getDeclaration = (section, subSection) => {
    if (!taxDeclaration || !taxDeclaration.declarations) return null;
    return taxDeclaration.declarations.find(
      (d) => d.section === section && d.subSection === subSection
    );
  };

  // Calculate total declared amount for a section
  const getSectionTotal = (sectionId) => {
    if (!taxDeclaration || !taxDeclaration.declarations) return 0;

    // When in edit mode, use the current edit values
    if (editMode) {
      let total = 0;
      // Go through all edit values and sum those that belong to this section
      Object.entries(editValues).forEach(([key, value]) => {
        const [section, _] = key.split("_");
        if (section === sectionId) {
          total += parseFloat(value) || 0;
        }
      });
      return total;
    } else {
      // Use the stored declaration values when not in edit mode
      return taxDeclaration.declarations
        .filter((d) => d.section === sectionId)
        .reduce((total, decl) => total + (decl.declaredAmount || 0), 0);
    }
  };
  // Check if section total exceeds limit
  const isOverLimit = (section, limit) => {
    if (!limit) return false;
    const total = getSectionTotal(section);
    return total > limit;
  };

  // Track edits
  let editMode = false;
  let editValues = {};

  onMount(() => {
    if (taxDeclaration && taxDeclaration.declarations) {
      editValues = {}; // Reset editValues first
      taxDeclaration.declarations.forEach((decl) => {
        editValues[`${decl.section}_${decl.subSection}`] = decl.declaredAmount;
      });
    }
  });

  // Toggle edit mode
  const toggleEditMode = () => {
    editMode = !editMode;

    // Reset edit values when entering edit mode
    if (editMode) {
      editValues = {}; // Start fresh

      // First, initialize all possible fields to 0
      deductionSections.forEach((section) => {
        section.subsections.forEach((subsection) => {
          editValues[`${section.id}_${subsection.id}`] = 0;
        });
      });

      // Then, populate with existing declaration values
      if (taxDeclaration && taxDeclaration.declarations) {
        taxDeclaration.declarations.forEach((decl) => {
          if (decl.section && decl.subSection) {
            editValues[`${decl.section}_${decl.subSection}`] =
              decl.declaredAmount || 0;
          }
        });
      }

      console.log("Edit values initialized:", editValues);
    }
  };

  // Handle input change
  const handleInputChange = (section, subSection, value) => {
    console.log(section, "section InputChange");
    console.log(subSection, "subSection InputChange");
    console.log(value, "value InputChange");
    const key = `${section}_${subSection}`;
    console.log(editValues, "editValues");
    editValues[key] = parseFloat(value) || 0;
  };

  // Save declaration changes
  const saveChanges = () => {
    console.log(editValues, "submit");
    // Create declarations array clone for update
    const updatedDeclarations: any = [];

    // For each possible declaration in our structure
    deductionSections.forEach((section) => {
      section.subsections.forEach((subsection) => {
        const key = `${section.id}_${subsection.id}`;
        const value = parseFloat(editValues[key]) || 0;

        // Find if this declaration already exists
        const existingDecl = taxDeclaration.declarations.find(
          (d) => d.section === section.id && d.subSection === subsection.id
        );

        if (value > 0) {
          // Only add/update declarations with non-zero amounts
          if (existingDecl) {
            // Update existing declaration
            updatedDeclarations.push({
              ...existingDecl,
              declaredAmount: value,
              lastUpdated: new Date(),
            });
          } else {
            // Add new declaration
            updatedDeclarations.push({
              sectionId: section.id,
              section: section.id,
              subSectionId: subsection.id,
              subSection: subsection.id,
              maxLimit: subsection.maxLimit || section.maxLimit || 0,
              description: section.description || "",
              declaredAmount: value,
              verifiedAmount: 0,
              status: "pending",
              documents: [],
              lastUpdated: new Date(),
            });
          }
        } else if (existingDecl) {
          // For existing declarations with 0 value, maintain them with status "no_declaration"
          // or remove them entirely (depending on your business logic)
          // Option 1: Keep with special status
          updatedDeclarations.push({
            ...existingDecl,
            declaredAmount: 0,
            status: "pending", // Or use a more appropriate status for your enum
            lastUpdated: new Date(),
          });

          // Option 2: Remove entirely (uncomment this and comment Option 1 if preferred)
          // Do nothing, which effectively removes the declaration
        }
      });
    });

    console.log("Updated declarations:", updatedDeclarations);

    // For demo, update local state
    taxDeclaration = {
      ...taxDeclaration,
      declarations: updatedDeclarations,
    };

    // Exit edit mode
    editMode = false;
  };

  // Cancel edit
  const cancelEdit = () => {
    editMode = false;
  };

  // Calculate total declared amount
  $: totalDeclared =
    taxDeclaration && taxDeclaration.declarations
      ? taxDeclaration.declarations.reduce(
          (sum, d) => sum + d.declaredAmount,
          0
        )
      : 0;

  // Calculate total verified amount
  $: totalVerified =
    taxDeclaration && taxDeclaration.declarations
      ? taxDeclaration.declarations.reduce(
          (sum, d) => sum + d.verifiedAmount,
          0
        )
      : 0;
</script>

<div class="it-declaration">
  <div class="header">
    <div class="summary">
      <div class="summary-item">
        <span class="label">Total Declared:</span>
        <span class="value">{formatCurrency(totalDeclared)}</span>
      </div>
      <div class="summary-item">
        <span class="label">Total Verified:</span>
        <span class="value">{formatCurrency(totalVerified)}</span>
      </div>
    </div>

    <div class="actions">
      {#if !editMode && !taxDeclaration.isLocked}
        <button class="btn-edit" on:click={toggleEditMode}>
          Edit Declarations
        </button>
      {/if}

      {#if editMode}
        <button class="btn-cancel" on:click={cancelEdit}> Cancel </button>
        <button class="btn-save" on:click={saveChanges}> Save Changes </button>
      {/if}
    </div>
  </div>

  {#if taxDeclaration.isLocked}
    <div class="locked-notice">
      <p>
        Declaration window is closed. You cannot make further changes to your
        declarations.
      </p>
    </div>
  {/if}

  <div class="sections">
    {#each deductionSections as section}
      <div class="section">
        <div class="section-header">
          <h3>{section.title}</h3>
          <div class="section-info">
            <p>{section.description}</p>
            {#if section.maxLimit}
              <p class="limit">
                Max Limit: {formatCurrency(section.maxLimit)}

                {#if isOverLimit(section.id, section.maxLimit)}
                  <span class="over-limit">Limit Exceeded</span>
                {/if}
              </p>
            {/if}
          </div>

          <div class="section-total">
            <span>Total: {formatCurrency(getSectionTotal(section.id))}</span>
          </div>
        </div>

        <div class="subsections">
          {#each section.subsections as subsection}
            {@const declaration = getDeclaration(section.id, subsection.id)}
            <div class="subsection">
              <div class="subsection-details">
                <div class="subsection-name">
                  {subsection.name}
                  {#if subsection.note}
                    <span class="note">({subsection.note})</span>
                  {/if}
                  {#if subsection.maxLimit}
                    <span class="sublimit"
                      >Max: {formatCurrency(subsection.maxLimit)}</span
                    >
                  {/if}
                </div>

                {#if editMode}
                  <div class="input-container">
                    <input
                      type="number"
                      min="0"
                      on:input={(e) =>
                        handleInputChange(
                          section.id,
                          subsection.id,
                          e.target.value
                        )}
                    />
                  </div>
                {:else}
                  <div class="amount-status">
                    <div class="amounts">
                      {#if declaration}
                        <div class="declared">
                          <span class="label">Declared:</span>
                          <span class="value"
                            >{formatCurrency(declaration.declaredAmount)}</span
                          >
                        </div>
                        <div class="verified">
                          <span class="label">Verified:</span>
                          <span class="value"
                            >{formatCurrency(declaration.verifiedAmount)}</span
                          >
                        </div>
                      {:else}
                        <div class="no-declaration">No declaration</div>
                      {/if}
                    </div>

                    {#if declaration}
                      <div class="status status-{declaration.status}">
                        {declaration.status === "pending" ? "Pending" : ""}
                        {declaration.status === "verified" ? "Verified" : ""}
                        {declaration.status === "rejected" ? "Rejected" : ""}
                        {declaration.status === "resubmission_requested"
                          ? "Resubmission"
                          : ""}
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .it-declaration {
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
    color: #333;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
  }

  .summary {
    display: flex;
    gap: 2rem;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
  }

  .summary-item .label {
    font-size: 0.9rem;
    color: #666;
  }

  .summary-item .value {
    font-size: 1.25rem;
    font-weight: 600;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  button {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    border: none;
  }

  .btn-edit {
    background-color: #e0f2fe;
    color: #0369a1;
  }

  .btn-cancel {
    background-color: #f1f5f9;
    color: #64748b;
  }

  .btn-save {
    background-color: #0369a1;
    color: white;
  }

  .locked-notice {
    background-color: #fff4e5;
    border-left: 4px solid #ff9800;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    border-radius: 4px;
  }

  .locked-notice p {
    margin: 0;
    color: #804a00;
  }

  .section {
    margin-bottom: 2rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
  }

  .section-header {
    background-color: #f8fafc;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .section-header h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
    color: #0f172a;
  }

  .section-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .section-info p {
    margin: 0;
    font-size: 0.9rem;
    color: #64748b;
  }

  .limit {
    font-weight: 500;
    color: #475569;
  }

  .over-limit {
    color: #ef4444;
    font-weight: 600;
    margin-left: 0.5rem;
  }

  .section-total {
    font-weight: 600;
    color: #0f172a;
    text-align: right;
  }

  .subsections {
    padding: 0.5rem;
  }

  .subsection {
    padding: 0.75rem;
    border-bottom: 1px solid #f1f5f9;
  }

  .subsection:last-child {
    border-bottom: none;
  }

  .subsection-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .subsection-name {
    font-weight: 500;
    color: #1e293b;
  }

  .note {
    font-weight: normal;
    font-size: 0.85rem;
    color: #64748b;
    margin-left: 0.25rem;
  }

  .sublimit {
    font-size: 0.85rem;
    color: #475569;
    background-color: #f1f5f9;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    margin-left: 0.5rem;
  }

  .amount-status {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .amounts {
    display: flex;
    gap: 1rem;
  }

  .declared,
  .verified {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .declared .label,
  .verified .label {
    font-size: 0.8rem;
    color: #64748b;
  }

  .declared .value {
    color: #0369a1;
    font-weight: 500;
  }

  .verified .value {
    color: #047857;
    font-weight: 500;
  }

  .no-declaration {
    font-style: italic;
    color: #94a3b8;
  }

  .status {
    font-size: 0.8rem;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-weight: 500;
    text-transform: uppercase;
  }

  .status-pending {
    background-color: #f1f5f9;
    color: #64748b;
  }

  .status-verified {
    background-color: #dcfce7;
    color: #047857;
  }

  .status-rejected {
    background-color: #fee2e2;
    color: #b91c1c;
  }

  .status-resubmission_requested {
    background-color: #fff7ed;
    color: #c2410c;
  }

  .input-container input {
    width: 150px;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    text-align: right;
  }

  input:focus {
    outline: none;
    border-color: #0ea5e9;
    box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
  }
</style>
