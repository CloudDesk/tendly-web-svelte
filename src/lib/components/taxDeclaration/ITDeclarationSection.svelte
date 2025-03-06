<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { formatCurrency } from "$lib/utils/currency";
  import { writable } from "svelte/store";
  import type { TaxDeclaration } from "$lib/types";
  import Modal from "../common/Modal.svelte";
  import InvestmentProofUploader from "./InvestmentProofUploader.svelte";

  // Extend TaxDeclaration type to include annualGross for dynamic limits
  export let taxDeclaration: TaxDeclaration & { annualGross?: number };

  console.log(taxDeclaration, "taxDeclaration");
  // Error store for better UI feedback
  export const errors = writable<string[]>([]);

  let isShowModal = false;

  const dispatch = createEventDispatcher();

  $: {
    if (editMode) {
      const activeErrors = Object.values(editErrors).filter(Boolean);
      if (activeErrors.length > 0) {
        errors.set(activeErrors);
      } else {
        errors.set([]);
      }
    }
  }

  // Define deduction sections with improved structure for limits
  const deductionSections = [
    {
      id: "80C",
      title: "Section 80C",
      description: "Deduction for Investment in Specified Savings Instruments",
      maxLimit: 150000, // Overall section limit of ₹1.5 lakh
      limitType: "section", // Indicates the limit applies to whole section
      subsections: [
        { id: "life_insurance", name: "Life Insurance Premium" },
        { id: "epf", name: "Employee Provident Fund (EPF)" },
        // Additional subsections can be added here
      ],
    },
    {
      id: "80D",
      title: "Section 80D",
      description: "Deduction for Premium Paid on Health Insurance",
      maxLimit: null, // No overall section limit
      limitType: "subsection", // Indicates limits are at subsection level
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
    // Add other sections like 80GG, 80CCD2 etc. with appropriate limit types
    {
      id: "80GG",
      title: "Section 80GG",
      description: "Deduction for Rent Paid",
      limitType: "dynamic", // Special case with dynamic limit
      maxLimit: null, // Will be calculated dynamically
      subsections: [{ id: "rent_paid", name: "Rent Paid" }],
    },
    {
      id: "80CCD2",
      title: "Section 80CCD(2)",
      description: "Employer's contribution to NPS",
      limitType: "dynamic", // Special case with dynamic limit
      maxLimit: null, // Will be calculated dynamically
      subsections: [
        { id: "employer_nps", name: "Employer's NPS Contribution" },
      ],
    },
  ];

  // Get declarations by section
  const getDeclarationsBySection = (section: string) => {
    if (!taxDeclaration || !taxDeclaration.declarations) return [];
    return taxDeclaration.declarations.filter((d) => d.section === section);
  };

  // Get declaration by section and subsection
  const getDeclaration = (section: string, subSection: string) => {
    if (!taxDeclaration || !taxDeclaration.declarations) return null;
    return taxDeclaration.declarations.find(
      (d) => d.section === section && d.subSection === subSection
    );
  };

  // Calculate total declared amount for a section
  const getSectionTotal = (sectionId: string) => {
    if (!taxDeclaration || !taxDeclaration.declarations) return 0;

    if (editMode) {
      let total = 0;
      Object.entries(editValues).forEach(([key, value]) => {
        const [section] = key.split("_");
        if (section === sectionId) {
          total += parseFloat(value as string) || 0;
        }
      });
      return total;
    } else {
      return taxDeclaration.declarations
        .filter((d) => d.section === sectionId)
        .reduce((total, decl) => total + (decl.declaredAmount || 0), 0);
    }
  };

  // Check if section or subsection total exceeds limit
  const isOverLimit = (sectionId: string, subsectionId?: string) => {
    const section = deductionSections.find((s) => s.id === sectionId);
    if (!section) return false;

    if (subsectionId) {
      // Check subsection limit
      const subsection = section.subsections.find(
        (ss) => ss.id === subsectionId
      );
      if (!subsection || !subsection.maxLimit) return false;

      const key = `${sectionId}_${subsectionId}`;
      const value = editMode
        ? parseFloat(editValues[key] as string) || 0
        : getDeclaration(sectionId, subsectionId)?.declaredAmount || 0;

      return value > calculateDynamicLimit(sectionId, subsectionId);
    } else {
      // Check section limit
      if (
        section.limitType !== "section" &&
        section.limitType !== "both" &&
        section.limitType !== "dynamic"
      )
        return false;

      const limit = calculateDynamicLimit(sectionId);
      if (limit === Infinity) return false;

      return getSectionTotal(sectionId) > limit;
    }
  };

  // Calculate dynamic limits based on section/subsection
  const calculateDynamicLimit = (sectionId: string, subsectionId?: string) => {
    const section = deductionSections.find((s) => s.id === sectionId);
    if (!section) return Infinity;

    // Handle special cases with dynamic limits
    if (sectionId === "80GG") {
      const annualGross = taxDeclaration.annualGross || 0;
      const rentPaid =
        parseFloat(editValues["80GG_rent_paid"] as unknown as string) || 0;

      const incomeLimit = (taxDeclaration.annualGross || 0) * 0.25;
      const excessRent = rentPaid - annualGross * 0.1;
      return Math.min(60000, incomeLimit);
    } else if (sectionId === "80CCD2") {
      return (taxDeclaration.annualGross || 0) * 0.1;
    }

    // Handle subsection limits if specified
    if (subsectionId) {
      const subsection = section.subsections.find(
        (ss) => ss.id === subsectionId
      );
      if (subsection?.maxLimit) return subsection.maxLimit;
    }

    // Return section limit or infinity if no limit applies
    return section.maxLimit || Infinity;
  };

  // Track edits and errors
  let editMode = false;
  let editValues: { [key: string]: number } = {};
  let editErrors: { [key: string]: string } = {};
  let uploadedFiles: { [key: string]: File } = {};
  let showUploadModal = false;

  onMount(() => {
    if (taxDeclaration && taxDeclaration.declarations) {
      editValues = {};
      taxDeclaration.declarations.forEach((decl) => {
        editValues[`${decl.section}_${decl.subSection}`] = decl.declaredAmount;
      });
    }
  });

  // Toggle edit mode
  const toggleEditMode = () => {
    editMode = !editMode;

    if (editMode) {
      editValues = {};
      editErrors = {};
      uploadedFiles = {};

      deductionSections.forEach((section) => {
        section.subsections.forEach((subsection) => {
          editValues[`${section.id}_${subsection.id}`] = 0;
        });
      });

      if (taxDeclaration && taxDeclaration.declarations) {
        taxDeclaration.declarations.forEach((decl) => {
          if (decl.section && decl.subSection) {
            editValues[`${decl.section}_${decl.subSection}`] =
              decl.declaredAmount || 0;
          }
        });
      }
    }
  };

  // Handle input change with comprehensive validation for all limit types
  const handleInputChange = (
    section: string,
    subSection: string,
    value: string
  ) => {
    const key = `${section}_${subSection}`;
    const parsedValue = parseFloat(value) || 0;
    const sectionObj = deductionSections.find((s) => s.id === section);
    if (!sectionObj) return;

    // Clear previous error for this field
    delete editErrors[key];

    // Set the value first
    editValues[key] = parsedValue;

    // Validate based on limit type
    if (
      sectionObj.limitType === "subsection" ||
      sectionObj.limitType === "both"
    ) {
      // Check subsection limit
      const subsection = sectionObj.subsections.find(
        (ss) => ss.id === subSection
      );
      const subSectionLimit = calculateDynamicLimit(section, subSection);

      if (subSectionLimit !== Infinity && parsedValue > subSectionLimit) {
        editErrors[key] =
          `Exceeds max limit of ${formatCurrency(subSectionLimit)}`;
        editValues[key] = subSectionLimit; // Cap at max limit
      }
    }

    if (
      sectionObj.limitType === "section" ||
      sectionObj.limitType === "both" ||
      sectionObj.limitType === "dynamic"
    ) {
      // Check section total limit
      const sectionLimit = calculateDynamicLimit(section);
      if (sectionLimit !== Infinity) {
        const sectionTotal = getSectionTotal(section);

        if (sectionTotal > sectionLimit) {
          // Calculate how much this subsection needs to be reduced
          const excess = sectionTotal - sectionLimit;
          const newValue = Math.max(0, parsedValue - excess);

          editValues[key] = newValue;
          editErrors[key] =
            `Section limit reached. Adjusted to ${formatCurrency(newValue)}`;
        }
      }
    }

    // Update the errors store
    const activeErrors = Object.values(editErrors).filter(Boolean);
    if (activeErrors.length > 0) {
      errors.set(activeErrors);
    } else {
      errors.set([]);
    }
  };

  // Handle file upload for POI
  const handleFileUpload = (event: CustomEvent) => {
    const { files } = event.detail;
    console.log("Files in ItDeclarationSection:", files);
    isShowModal = false;
    dispatch("fileupload", files);
  };

  // Validate all declarations based on limit types
  const validateDeclarations = () => {
    const validationErrors: string[] = [];

    deductionSections.forEach((section) => {
      // Validate section limits
      if (
        section.limitType === "section" ||
        section.limitType === "both" ||
        section.limitType === "dynamic"
      ) {
        const sectionLimit = calculateDynamicLimit(section.id);
        if (sectionLimit !== Infinity) {
          const sectionTotal = getSectionTotal(section.id);
          if (sectionTotal > sectionLimit) {
            validationErrors.push(
              `${section.title} exceeds max limit of ${formatCurrency(sectionLimit)}`
            );
          }
        }
      }

      // Validate subsection limits
      if (section.limitType === "subsection" || section.limitType === "both") {
        section.subsections.forEach((subsection) => {
          const key = `${section.id}_${subsection.id}`;
          const value = parseFloat(editValues[key] as string) || 0;
          const subsectionLimit = calculateDynamicLimit(
            section.id,
            subsection.id
          );

          if (subsectionLimit !== Infinity && value > subsectionLimit) {
            validationErrors.push(
              `${subsection.name} exceeds max limit of ${formatCurrency(subsectionLimit)}`
            );
          }
        });
      }
    });

    return validationErrors;
  };

  // Save declaration changes
  const saveChanges = () => {
    console.log(uploadedFiles, "uploadedFiles");
    // Validate all declarations
    const validationErrors = validateDeclarations();

    if (validationErrors.length > 0) {
      errors.set(validationErrors);
      return;
    }

    const updatedDeclarations: any[] = [];

    deductionSections.forEach((section) => {
      section.subsections.forEach((subsection) => {
        const key = `${section.id}_${subsection.id}`;
        const value = parseFloat(editValues[key] as string) || 0;

        if (value > 0) {
          const existingDecl = taxDeclaration.declarations.find(
            (d) => d.section === section.id && d.subSection === subsection.id
          );

          const file = uploadedFiles[key];
          const documents = file
            ? [
                {
                  documentName: file.name,
                  documentPath: "",
                  uploadDate: new Date(),
                  isLatestVersion: true,
                },
              ]
            : existingDecl?.documents || [];

          if (existingDecl) {
            updatedDeclarations.push({
              ...existingDecl,
              declaredAmount: value,
              documents,
              // lastUpdated: new Date(),
            });
          } else {
            // Determine the appropriate maxLimit for this declaration
            let declMaxLimit: number;
            if (
              section.limitType === "subsection" ||
              section.limitType === "both"
            ) {
              declMaxLimit = calculateDynamicLimit(section.id, subsection.id);
            } else {
              declMaxLimit = calculateDynamicLimit(section.id);
            }

            updatedDeclarations.push({
              section: section.id,
              subSection: subsection.id,
              maxLimit: declMaxLimit === Infinity ? null : declMaxLimit,
              declaredAmount: value,
              verifiedAmount: 0,
              status: "pending",
              documents,
              // lastUpdated: new Date(),
            });
          }
        }
      });
    });

    console.log(updatedDeclarations, "updatedDeclarations");
    taxDeclaration = {
      ...taxDeclaration,
      declarations: [...updatedDeclarations],
    };
    dispatch("update", {
      updatedTaxDeclaration: {
        ...taxDeclaration,
        declarations: updatedDeclarations,
      },
    });
    console.log(taxDeclaration, "taxDeclaration");
    editMode = false;
    uploadedFiles = {};
    errors.set([]);
  };

  const updatedDeclaration = async (taxDeclaration: TaxDeclaration) => {
    try {
    } catch (error) {}
  };

  // Cancel edit
  const cancelEdit = () => {
    editMode = false;
    editErrors = {};
    uploadedFiles = {};
    errors.set([]);
  };

  const openModal = () => {
    isShowModal = true;
  };
  const closeModal = () => {
    isShowModal = false;
  };

  // Calculate total declared amount
  $: totalDeclared =
    taxDeclaration && taxDeclaration.declarations
      ? taxDeclaration.declarations.reduce(
          (sum, d) => sum + (d.declaredAmount || 0),
          0
        )
      : 0;

  // Calculate total verified amount
  $: totalVerified =
    taxDeclaration && taxDeclaration.declarations
      ? taxDeclaration.declarations.reduce(
          (sum, d) => sum + (d.verifiedAmount || 0),
          0
        )
      : 0;
</script>

<div class="it-declaration">
  {#if $errors.length > 0}
    <div class="error-box">
      <ul>
        {#each $errors as error}
          <li>{error}</li>
        {/each}
      </ul>
    </div>
  {/if}

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
      {#if !editMode && !taxDeclaration.isLocked && !taxDeclaration.isPOISubmitted}
        <button class="btn btn-edit" on:click={toggleEditMode}>
          Edit Declarations
        </button>
        {#if taxDeclaration.poiSubmissionStatus === "not_submitted" && taxDeclaration.isDeclared}
          <button class="btn btn-upload" on:click={openModal}>
            Upload Documents
          </button>
        {/if}
      {/if}

      {#if editMode}
        <button class="btn btn-cancel" on:click={cancelEdit}>Cancel</button>
        <button
          class="btn btn-save"
          on:click={saveChanges}
          disabled={Object.keys(editErrors).length > 0}
        >
          Save Changes
        </button>
      {/if}
    </div>
  </div>

  {#if taxDeclaration.isLocked}
    <div class="locked-notice">
      {#if !taxDeclaration.declarations || taxDeclaration.declarations.length === 0}
        <p>
          IT declaration will open soon, please contact admin for further
          information.
        </p>
      {:else}
        <p>
          Declaration window is closed. You cannot make further changes to your
          declaration and ALL declarations.
        </p>
      {/if}
    </div>
  {/if}

  <div class="sections">
    {#each deductionSections as section}
      <div class="section">
        <div class="section-header">
          <h3>{section.title}</h3>
          <div class="section-info">
            <p>{section.description}</p>
            {#if section.limitType === "section" || section.limitType === "both" || section.limitType === "dynamic"}
              {@const dynamicLimit = calculateDynamicLimit(section.id)}
              <p class="limit">
                Max Limit:
                {dynamicLimit === Infinity
                  ? section.limitType === "dynamic"
                    ? section.id === "80CCD2"
                      ? "10% of salary"
                      : "Calculated based on income"
                    : "No fixed limit"
                  : formatCurrency(dynamicLimit)}
                {#if isOverLimit(section.id)}
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
                  {#if subsection.maxLimit || section.limitType === "subsection" || section.limitType === "both"}
                    {@const subsectionLimit = calculateDynamicLimit(
                      section.id,
                      subsection.id
                    )}
                    {#if subsectionLimit !== Infinity}
                      <span class="sublimit"
                        >Max: {formatCurrency(subsectionLimit)}</span
                      >
                      {#if isOverLimit(section.id, subsection.id)}
                        <span class="over-limit">Limit Exceeded</span>
                      {/if}
                    {/if}
                  {/if}
                </div>

                {#if editMode}
                  <div class="input-container">
                    <input
                      type="number"
                      min="0"
                      value={editValues[`${section.id}_${subsection.id}`] || 0}
                      on:input={(e) =>
                        handleInputChange(
                          section.id,
                          subsection.id,
                          e.target.value
                        )}
                    />
                    {#if editErrors[`${section.id}_${subsection.id}`]}
                      <span class="error"
                        >{editErrors[`${section.id}_${subsection.id}`]}</span
                      >
                    {/if}
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
                  {#if declaration && declaration.documents.length > 0}
                    <div class="documents">
                      <span>Documents:</span>
                      <ul>
                        {#each declaration.documents as doc}
                          <li>
                            <a
                              href={doc.documentPath}
                              target="_blank"
                              class="underline {doc.isLatestVersion
                                ? 'text-blue-500'
                                : 'text-red-500'}"
                            >
                              {doc.documentName}
                            </a>
                            <span
                              class={doc.isLatestVersion
                                ? "text-blue-500"
                                : "text-red-500"}
                            >
                              ({doc.isLatestVersion
                                ? "Latest Version"
                                : "Outdated Version - Upload new document if required"})
                            </span>
                          </li>
                        {/each}
                      </ul>
                    </div>
                  {/if}
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<Modal show={isShowModal} title="Upload Investment Proofs" onClose={closeModal}>
  <InvestmentProofUploader
    declarations={taxDeclaration.declarations}
    sections={deductionSections}
    on:upload={handleFileUpload}
  />
</Modal>

<style>
  .it-declaration {
    padding: 20px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .summary {
    display: flex;
    gap: 20px;
  }
  .summary-item {
    display: flex;
    gap: 8px;
  }
  .label {
    font-weight: bold;
  }
  .actions {
    display: flex;
    gap: 20px; /* Consistent spacing between buttons */
  }
  .btn {
    padding: 0.5rem 0.75rem; /* px-3 py-2 */
    border-radius: 0.25rem; /* rounded */
    font-weight: 500; /* font-medium */
    font-size: 0.875rem; /* text-sm */
    display: flex;
    align-items: center;
    gap: 0.5rem; /* gap-2 */
    cursor: pointer;
    transition: background-color 0.2s; /* transition-colors */
  }
  .btn-edit {
    background-color: #2563eb; /* blue-600 */
    color: #ffffff;
  }

  .btn-edit:hover {
    background-color: #1d4ed8; /* blue-700 */
  }

  .btn-edit:focus {
    outline: none;
    box-shadow: 0 0 0 2px #3b82f6; /* focus:ring-2 focus:ring-blue-500 */
    box-shadow:
      0 0 0 2px #3b82f6,
      0 0 0 4px transparent; /* focus:ring-offset-2 */
  }

  .btn-upload {
    background-color: #16a34a; /* green-600 */
    color: #ffffff;
  }

  .btn-upload:hover {
    background-color: #15803d; /* green-700 */
  }

  .btn-upload:focus {
    outline: none;
    box-shadow: 0 0 0 2px #22c55e; /* focus:ring-2 focus:ring-green-500 */
    box-shadow:
      0 0 0 2px #22c55e,
      0 0 0 4px transparent; /* focus:ring-offset-2 */
  }
  .btn-save {
    background-color: #28a745;
    color: white;
  }
  .btn-cancel {
    background-color: #dc3545;
    color: white;
  }
  .locked-notice {
    background-color: #f8d7da;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 5px;
  }
  .section {
    margin-bottom: 10px;
    border: 1px solid #ddd;
    padding: 15px;
    border-radius: 5px;
  }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .section-info p {
    margin: 5px 0;
  }
  .limit {
    font-weight: bold;
  }
  .over-limit {
    color: red;
    margin-left: 10px;
  }
  .section-total {
    font-weight: bold;
  }
  .subsection {
    padding: 10px;
    border-top: 1px solid #eee;
  }
  .subsection-name {
    flex: 1;
  }
  .note {
    font-size: 0.9em;
    color: #666;
  }
  .sublimit {
    margin-left: 10px;
    font-weight: bold;
  }
  .input-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .input-container input[type="number"] {
    width: 100px;
    padding: 5px;
    margin-bottom: 5px;
  }
  .input-container input[type="file"] {
    font-size: 0.9em;
  }
  .error {
    color: red;
    font-size: 0.8em;
  }
  .amount-status {
    display: flex;
    gap: 20px;
    align-items: center;
  }
  .amounts {
    text-align: right;
  }
  .declared,
  .verified {
    margin: 5px 0;
  }
  .no-declaration {
    color: #666;
  }
  .status {
    padding: 5px 10px;
    border-radius: 5px;
    text-transform: capitalize;
  }
  .status-pending {
    background-color: #ffc107;
  }
  .status-verified {
    background-color: #28a745;
    color: white;
  }
  .status-rejected {
    background-color: #dc3545;
    color: white;
  }
  .status-resubmission_requested {
    background-color: #17a2b8;
    color: white;
  }
  .error-box {
    background-color: #f8d7da;
    padding: 10px;
    margin-bottom: 20px;
    border-radius: 5px;
  }
  .error-box ul {
    margin: 0;
    padding-left: 20px;
  }
  .documents {
    margin-top: 5px;
    font-size: 0.9em;
    color: #666;
  }
</style>
