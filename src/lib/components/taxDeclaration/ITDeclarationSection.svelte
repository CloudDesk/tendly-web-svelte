<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { formatCurrency } from "$lib/utils/currency";
  import { writable } from "svelte/store";
  import type { TaxDeclaration } from "$lib/types";
  import Modal from "../common/Modal.svelte";
  import InvestmentProofUploader from "./InvestmentProofUploader.svelte";
  import {
    Info,
    Upload,
    Check,
    X as IconX,
    RefreshCw as IconRefresh,
    Clock as IconClock,
    Edit as IconEdit,
    Save as IconSave,
    X as IconCancel,
  } from "lucide-svelte";

  // Extend TaxDeclaration type to include annualGross for dynamic limits
  export let taxDeclaration: TaxDeclaration & { annualGross?: number };

  // Error store for better UI feedback
  export const errors = writable<string[]>([]);

  let isShowModal = false;
  const dispatch = createEventDispatcher();

  // Add reactive statement for hasValidationErrors
  $: hasValidationErrors = Object.values(editErrors).some(error => error && error.trim() !== '');

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
  interface ISubsection {
    id: string;
    name: string;
    maxLimit?: number | null; // Make maxLimit optional
    note?: string;
  }

  // Define deduction sections with improved structure for limits
  const deductionSections: {
    id: string;
    title: string;
    description: string;
    maxLimit: number | null;
    limitType: "section" | "subsection" | "dynamic" | "both";
    subsections: ISubsection[];
  }[] = [
    {
      id: "80C",
      title: "Section 80C",
      description: "Deduction for Investment in Specified Savings Instruments",
      maxLimit: 150000,
      limitType: "section",
      subsections: [
        {
          id: "life_insurance",
          name: "Life Insurance Premium",
          maxLimit: 0 as number | null,
          note: "",
        },
        {
          id: "epf",
          name: "Employee Provident Fund (EPF)",
          maxLimit: 0,
          note: "",
        },
        // Additional subsections can be added here
        // Additional subsections can be added here
      ],
    },
    {
      id: "80D",
      title: "Section 80D",
      description: "Deduction for Premium Paid on Health Insurance",
      maxLimit: null,
      limitType: "subsection",
      subsections: [
        {
          id: "self_family",
          name: "Health Insurance for self, spouse, children",
          maxLimit: 25000 as number | null,
        },
        {
          id: "parents",
          name: "Health Insurance for Parents",
          maxLimit: 50000 as number | null,
          note: "For senior citizen parents",
        },
      ],
    },
    {
      id: "80GG",
      title: "Section 80GG",
      description: "Deduction for Rent Paid",
      limitType: "dynamic",
      maxLimit: null,
      subsections: [{ id: "rent_paid", name: "Rent Paid" }],
    },
    {
      id: "80CCD2",
      title: "Section 80CCD(2)",
      description: "Employer's contribution to NPS",
      limitType: "dynamic",
      maxLimit: null,
      subsections: [
        {
          id: "employer_nps",
          name: "Employer's NPS Contribution",
          maxLimit: 0,
        },
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
          total += parseFloat(value as unknown as string) || 0;
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
      if (
        !subsection ||
        !("maxLimit" in subsection) ||
        typeof subsection.maxLimit !== "number"
      )
        return false;

      const key = `${sectionId}_${subsectionId}`;
      const value = editMode
        ? parseFloat(editValues[key] as unknown as string) || 0
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
    event: Event
  ) => {
    const target = event.target as HTMLInputElement;
    const value = target.value || "";
    const key = `${section}_${subSection}`;
    const parsedValue = parseFloat(value) || 0;
    const sectionObj = deductionSections.find((s) => s.id === section);
    if (!sectionObj) return;

    // Clear previous error for this field
    editErrors[key] = "";

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

    // Trigger reactive updates by reassigning the objects
    editValues = { ...editValues };
    editErrors = { ...editErrors };

    // Update the errors store
    const activeErrors = Object.values(editErrors).filter(error => error && error.trim() !== '');
    if (activeErrors.length > 0) {
      errors.set(activeErrors);
    } else {
      errors.set([]);
    }
  };

  // Handle file upload for POI
  const handleFileUpload = (event: CustomEvent) => {
    const { files } = event.detail;
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
          const value = parseFloat(editValues[key] as unknown as string) || 0;
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
        const value = parseFloat(editValues[key] as unknown as string) || 0;

        if (value > 0) {
          const existingDecl = taxDeclaration.declarations?.find(
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
            });
          }
        }
      });
    });

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

    editMode = false;
    uploadedFiles = {};
    errors.set([]);
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

  // Status renderer
  const getStatusComponent = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: IconClock,
          text: "Pending",
          bgColor: "bg-amber-100",
          textColor: "text-amber-800",
        };
      case "verified":
        return {
          icon: Check,
          text: "Verified",
          bgColor: "bg-green-100",
          textColor: "text-green-800",
        };
      case "rejected":
        return {
          icon: IconX,
          text: "Rejected",
          bgColor: "bg-red-100",
          textColor: "text-red-800",
        };
      case "resubmission_requested":
        return {
          icon: IconRefresh,
          text: "Resubmission",
          bgColor: "bg-blue-100",
          textColor: "text-blue-800",
        };
      default:
        return {
          icon: IconClock,
          text: "Pending",
          bgColor: "bg-amber-100",
          textColor: "text-amber-800",
        };
    }
  };
</script>

<div
  class="tax-declaration bg-white rounded-lg shadow-sm p-6 mb-6 max-w-5xl mx-auto"
>
  <!-- Summary Header -->
  <div
    class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
  >
    <div class="summary-container">
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        Tax Declaration Summary
      </h2>
      <div class="flex flex-wrap gap-4">
        <div
          class="summary-box bg-blue-50 p-3 rounded-lg border border-blue-100"
        >
          <span class="block text-sm text-blue-700 mb-1">Total Declared</span>
          <span class="text-xl font-bold text-blue-800"
            >{formatCurrency(totalDeclared)}</span
          >
        </div>
        <div
          class="summary-box bg-green-50 p-3 rounded-lg border border-green-100"
        >
          <span class="block text-sm text-green-700 mb-1">Total Verified</span>
          <span class="text-xl font-bold text-green-800"
            >{formatCurrency(totalVerified)}</span
          >
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-3">
      {#if !editMode && !taxDeclaration.isLocked && !taxDeclaration.isPOISubmitted}
        <button
          class="btn flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          on:click={toggleEditMode}
        >
          <IconEdit size={16} />
          Edit Declarations
        </button>
        {#if taxDeclaration.poiSubmissionStatus === "not_submitted" && taxDeclaration.isDeclared}
          <button
            class="btn flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            on:click={openModal}
          >
            <Upload size={16} />
            Upload Documents
          </button>
        {/if}
      {/if}

      {#if editMode}
        <button
          class="btn flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
          on:click={cancelEdit}
        >
          <IconCancel size={16} />
          Cancel
        </button>
        <button
          class="btn flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          on:click={saveChanges}
          disabled={hasValidationErrors}
        >
          <IconSave size={16} />
          Save Changes
        </button>
      {/if}

      {#if taxDeclaration.poiSubmissionStatus === "resubmission"}
        <button
          class="btn flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          on:click={openModal}
        >
          <Upload size={16} />
          Upload Documents
        </button>
      {/if}
    </div>
  </div>

  <!-- Error display -->
  {#if $errors.length > 0}
    <div
      class="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6"
      role="alert"
    >
      <h3 class="font-semibold mb-2 flex items-center">
        <IconX size={18} class="mr-2" />
        Please resolve the following issues:
      </h3>
      <ul class="list-disc pl-5 space-y-1">
        {#each $errors as error}
          <li>{error}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <!-- Locked Notice -->
  {#if taxDeclaration.isLocked}
    <div
      class="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-4 mb-6"
      role="alert"
    >
      {#if !taxDeclaration.declarations || taxDeclaration.declarations.length === 0}
        <p class="flex items-center">
          <Info size={18} class="mr-2" />
          IT declaration will open soon, please contact admin for further information.
        </p>
      {:else}
        <p class="flex items-center">
          <Info size={18} class="mr-2" />
          Declaration window is closed. You cannot make further changes to your declaration.
        </p>
      {/if}
    </div>
  {/if}

  <!-- Deduction Sections -->
  <div class="space-y-6">
    {#each deductionSections as section}
      <div
        class="section bg-gray-50 border border-gray-200 rounded-lg overflow-hidden"
      >
        <!-- Section Header -->
        <div class="section-header bg-gray-100 p-4 border-b border-gray-200">
          <div class="flex flex-col md:flex-row justify-between">
            <div class="section-info mb-3 md:mb-0">
              <h3 class="text-lg font-bold text-gray-800">{section.title}</h3>
              <p class="text-gray-600 text-sm">{section.description}</p>
              {#if section.limitType === "section" || section.limitType === "both" || section.limitType === "dynamic"}
                {@const dynamicLimit = calculateDynamicLimit(section.id)}
                <div class="limit flex items-center mt-1 text-sm">
                  <span class="font-medium mr-1">Max Limit:</span>
                  <span>
                    {dynamicLimit === Infinity
                      ? section.limitType === "dynamic"
                        ? section.id === "80CCD2"
                          ? "10% of salary"
                          : "Calculated based on income"
                        : "No fixed limit"
                      : formatCurrency(dynamicLimit)}
                  </span>
                  {#if isOverLimit(section.id)}
                    <span
                      class="ml-2 text-red-600 text-xs font-medium bg-red-100 px-2 py-0.5 rounded"
                      >Limit Exceeded</span
                    >
                  {/if}
                </div>
              {/if}
            </div>

            <div
              class="section-total bg-blue-50 text-blue-800 font-bold px-4 py-2 rounded-md flex items-center self-start"
            >
              <span
                >Section Total: {formatCurrency(
                  getSectionTotal(section.id)
                )}</span
              >
            </div>
          </div>
        </div>

        <!-- Section Content -->
        <div class="p-4">
          <div class="overflow-x-auto">
            <table class="w-full min-w-full divide-y divide-gray-200">
              <thead>
                <tr class="text-left text-gray-500 text-sm">
                  <th class="py-2 px-3 w-2/5">Subsection</th>
                  <th class="py-2 px-3 w-1/5 text-right">Declared</th>
                  <th class="py-2 px-3 w-1/5 text-right">Verified</th>
                  <th class="py-2 px-3 w-1/5">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                {#each section.subsections as subsection}
                  {@const declaration = getDeclaration(
                    section.id,
                    subsection.id
                  )}
                  <tr class="hover:bg-gray-50">
                    <td class="py-3 px-3">
                      <div class="flex flex-col">
                        <span class="font-medium text-gray-800"
                          >{subsection.name}</span
                        >
                        {#if "note" in subsection}
                          <span class="text-xs text-gray-500 mt-0.5"
                            >({subsection.note})</span
                          >
                        {/if}
                        {#if "maxLimit" in subsection || section.limitType === "subsection" || section.limitType === "both"}
                          {@const subsectionLimit = calculateDynamicLimit(
                            section.id,
                            subsection.id
                          )}
                          {#if subsectionLimit !== Infinity}
                            <span
                              class="text-xs text-gray-600 mt-0.5 flex items-center"
                            >
                              <span class="mr-1">Max:</span>
                              <span class="font-medium"
                                >{formatCurrency(subsectionLimit)}</span
                              >
                              {#if isOverLimit(section.id, subsection.id)}
                                <span
                                  class="ml-2 text-red-600 text-xs bg-red-50 px-1.5 py-0.5 rounded"
                                  >Limit Exceeded</span
                                >
                              {/if}
                            </span>
                          {/if}
                        {/if}
                      </div>
                    </td>
                    <td class="py-3 px-3">
                      {#if editMode}
                        <div class="flex flex-col items-end">
                          <input
                            type="number"
                            min="0"
                            class="w-full max-w-xs p-2 border border-gray-300 rounded text-right"
                            value={editValues[
                              `${section.id}_${subsection.id}`
                            ] || 0}
                            on:input={(e) => {
                              handleInputChange(section.id, subsection.id, e);
                            }}
                          />
                          {#if editErrors[`${section.id}_${subsection.id}`] && editErrors[`${section.id}_${subsection.id}`].trim() !== ''}
                            <span class="text-red-600 text-xs mt-1"
                              >{editErrors[
                                `${section.id}_${subsection.id}`
                              ]}</span
                            >
                          {/if}
                        </div>
                      {:else}
                        <div class="text-right font-medium">
                          {declaration
                            ? formatCurrency(declaration.declaredAmount)
                            : "—"}
                        </div>
                      {/if}
                    </td>
                    <td class="py-3 px-3">
                      <div class="text-right font-medium text-green-700">
                        {declaration
                          ? formatCurrency(declaration.verifiedAmount)
                          : "—"}
                      </div>
                    </td>
                    <td class="py-3 px-3">
                      {#if declaration}
                        {@const status = getStatusComponent(declaration.status)}
                        <div class="flex items-center">
                          <span
                            class={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}
                          >
                            <svelte:component
                              this={status.icon}
                              size={12}
                              class="mr-1"
                            />
                            {status.text}
                          </span>
                        </div>
                      {:else}
                        <span class="text-gray-400 text-sm">Not declared</span>
                      {/if}
                    </td>
                  </tr>

                  {#if declaration && declaration.documents.length > 0 && !editMode}
                    <tr class="bg-gray-50">
                      <td colspan="4" class="py-3 px-6 text-sm">
                        <div class="documents">
                          <h4 class="text-sm text-gray-700 font-medium mb-2">
                            Uploaded Documents:
                          </h4>
                          <ul class="space-y-1.5">
                            {#each declaration.documents as doc}
                              <li class="flex items-center">
                                <a
                                  href={doc.documentPath}
                                  target="_blank"
                                  class={`text-sm underline ${doc.isLatestVersion ? "text-blue-600" : "text-red-600"}`}
                                >
                                  {doc.documentName}
                                </a>
                                <span
                                  class={`ml-2 text-xs ${doc.isLatestVersion ? "text-blue-600 bg-blue-50" : "text-red-600 bg-red-50"} px-2 py-0.5 rounded-full`}
                                >
                                  {doc.isLatestVersion
                                    ? "Latest Version"
                                    : "Outdated - Upload new document"}
                                </span>
                              </li>
                            {/each}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
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
