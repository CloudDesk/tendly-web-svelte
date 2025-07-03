<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Button from "$lib/components/common/Button.svelte";
  import FileUpload from "$lib/components/common/FileUpload.svelte";

  export let loading = false;
  export let initialData = null;
  export let currentFilePath = null;

  //  const panMatch = (/^([A-Z]{5}[0-9]{4}[A-Z]{1}));
  const dispatch = createEventDispatcher();

  let certificateType: "Academic" | "Experience" | "IdentityProof" =
    initialData?.certificateType || "Academic";

  // Check if form should be read-only based on verification status
  $: isReadOnly =
    initialData?.verificationStatus &&
    initialData.verificationStatus !== "Pending";
  console.log("initialData", initialData);
  console.log("isReadOnly", isReadOnly);

  const statusConfig = {
    Pending: {
      class: "status-pending",
      icon: "⏳",
      gradient: "from-amber-50 to-orange-50",
      ring: "ring-amber-200/50",
      glow: "shadow-amber-100/50",
    },
    Verified: {
      class: "status-verified",
      icon: "✓",
      gradient: "from-emerald-50 to-green-50",
      ring: "ring-emerald-200/50",
      glow: "shadow-emerald-100/50",
    },
    Rejected: {
      class: "status-rejected",
      icon: "✕",
      gradient: "from-red-50 to-rose-50",
      ring: "ring-red-200/50",
      glow: "shadow-red-100/50",
    },
  };

  $: statusInfo = statusConfig[initialData?.verificationStatus] || "";

  let file: File | null = null;
  let fileError = "";
  let showFileUpload = false;
  let form = {
    // Common
    title: initialData?.title || "",
    issuingAuthority: initialData?.issuingAuthority || "",
    issueDate: initialData?.issueDate || "",
    expiryDate: initialData?.expiryDate || "",
    certificateId: initialData?.certificateId || "",
    // Academic
    qualificationType: initialData?.academicDetails?.qualificationType || "",
    fieldOfStudy: initialData?.academicDetails?.fieldOfStudy || "",
    grade: initialData?.academicDetails?.grade || "",
    institution: initialData?.academicDetails?.institution || "",
    yearOfCompletion:
      initialData?.academicDetails?.yearOfCompletion?.toString() || "",
    // Experience
    companyName: initialData?.experienceDetails?.companyName || "",
    role: initialData?.experienceDetails?.role || "",
    startDate: initialData?.experienceDetails?.startDate || "",
    endDate: initialData?.experienceDetails?.endDate || "",
    duration: initialData?.experienceDetails?.duration || "",
    // IdentityProof
    idType: initialData?.idDetails?.idType || "",
    idNumber: initialData?.idDetails?.idNumber || "",
    country: initialData?.idDetails?.country || "",
    uanNumber: initialData?.idDetails?.uanNumber || "", // For PF only
  };
  let errors: Record<string, string> = {};

  // Check if we're in edit mode
  $: isEditMode = !!initialData;

  // Enum options for Academic
  const qualificationTypes = [
    { value: "Secondary", label: "Secondary (10th)" },
    { value: "HigherSecondary", label: "Higher Secondary (12th)" },
    { value: "Diploma", label: "Diploma" },
    { value: "Bachelor", label: "Bachelor" },
    { value: "Master", label: "Master" },
    { value: "Doctorate", label: "Doctorate" },
    { value: "Other", label: "Other" },
  ];

  // Enum options for IdentityProof (now includes PF)
  const idTypes = [
    { value: "Aadhaar", label: "Aadhaar" },
    { value: "PAN", label: "PAN" },
    { value: "Passport", label: "Passport" },
    { value: "DriverLicense", label: "Driver License" },
    { value: "VoterID", label: "Voter ID" },
    { value: "PF", label: "Provident Fund (PF)" },
    { value: "Other", label: "Other" },
  ];

  // Dynamic help text for Title based on certificate type
  $: titleHelpText = (() => {
    switch (certificateType) {
      case "Academic":
        return "e.g. B.Tech Computer Science, M.Sc Physics";
      case "Experience":
        return "e.g. Software Engineer, Project Manager";
      case "IdentityProof":
        return "e.g. Aadhaar Card, PAN Card, Passport";
      default:
        return "Enter certificate title";
    }
  })();

  // Helper to determine if a field is required for the current certificate type
  function isRequired(field: string) {
    if (["title", "issuingAuthority", "issueDate"].includes(field)) return true;
    if (certificateType === "Academic") {
      return [
        "qualificationType",
        "fieldOfStudy",
        "institution",
        "yearOfCompletion",
        "certificateId",
      ].includes(field);
    }
    if (certificateType === "Experience") {
      return ["companyName", "role", "startDate"].includes(field);
    }
    if (certificateType === "IdentityProof") {
      if (field === "uanNumber") return form.idType === "PF";
      return ["idType", "idNumber"].includes(field); // Removed certificateId for IdentityProof
    }
    return false;
  }

  // Real-time error clearing for each field
  $: if (errors.title && form.title) errors.title = "";
  $: if (errors.issuingAuthority && form.issuingAuthority)
    errors.issuingAuthority = "";
  $: if (errors.issueDate && form.issueDate) errors.issueDate = "";
  $: if (errors.qualificationType && form.qualificationType)
    errors.qualificationType = "";
  $: if (errors.fieldOfStudy && form.fieldOfStudy) errors.fieldOfStudy = "";
  $: if (errors.institution && form.institution) errors.institution = "";
  $: if (errors.yearOfCompletion && form.yearOfCompletion)
    errors.yearOfCompletion = "";
  $: if (errors.certificateId && form.certificateId) errors.certificateId = "";
  $: if (errors.companyName && form.companyName) errors.companyName = "";
  $: if (errors.role && form.role) errors.role = "";
  $: if (errors.startDate && form.startDate) errors.startDate = "";
  $: if (errors.idType && form.idType) errors.idType = "";
  $: if (errors.idNumber && form.idNumber) errors.idNumber = "";
  $: if (errors.uanNumber && form.uanNumber) errors.uanNumber = "";

  function validate() {
    errors = {};
    // Common
    if (!form.title) errors.title = "Required";
    if (!form.issuingAuthority) errors.issuingAuthority = "Required";
    if (!form.issueDate) errors.issueDate = "Required";
    // File validation based on mode
    if (!isEditMode) {
      // Create mode: file is required
      if (!file) fileError = "Certificate file required";
      else fileError = "";
    } else {
      // Edit mode: file is optional (user can keep existing file)
      fileError = "";
    }
    // Type-specific
    if (certificateType === "Academic") {
      if (!form.qualificationType) errors.qualificationType = "Required";
      if (!form.fieldOfStudy) errors.fieldOfStudy = "Required";
      if (!form.institution) errors.institution = "Required";
      if (!form.yearOfCompletion) errors.yearOfCompletion = "Required";
      if (!form.certificateId)
        errors.certificateId = "Certificate ID is required";
    }
    if (certificateType === "Experience") {
      if (!form.companyName) errors.companyName = "Required";
      if (!form.role) errors.role = "Required";
      if (!form.startDate) errors.startDate = "Required";
    }
    if (certificateType === "IdentityProof") {
      if (!form.idType) errors.idType = "Required";
      if (!form.idNumber) errors.idNumber = "Required";
      // PAN format validation
      // if (form.idType === "PAN" && form.idNumber) {
      //   const panRegex = /^([A-Z]{5}[0-9]{4}[A-Z]{1})$/;
      //   if (!panRegex.test(form.idNumber)) {
      //     errors.idNumber = "Invalid PAN format. Example: ABCDE1234F";
      //   }
      // }
      if (form.idType === "PF" && !form.uanNumber)
        errors.uanNumber = "UAN Number is required for PF";
      // Removed certificateId validation for IdentityProof
    }
    return Object.keys(errors).length === 0 && !fileError;
  }
  console.log("errors", errors);
  function handleSubmit() {
    if (!validate()) return;

    let certificateData: any;

    if (isEditMode && initialData) {
      // In edit mode, preserve all existing data and only update changed fields
      certificateData = {
        ...initialData, // Preserve all existing data
        title: form.title,
        issuingAuthority: form.issuingAuthority,
        issueDate: form.issueDate,
        expiryDate: form.expiryDate || undefined,
        certificateType,
        // Only include certificateId for Academic
        ...(certificateType === "Academic" && {
          certificateId: form.certificateId,
        }),
      };

      // Update specific details based on certificate type while preserving existing data
      if (certificateType === "Academic") {
        certificateData.academicDetails = {
          ...initialData.academicDetails, // Preserve any existing academic details
          qualificationType: form.qualificationType,
          fieldOfStudy: form.fieldOfStudy,
          grade: form.grade,
          institution: form.institution,
          yearOfCompletion: Number(form.yearOfCompletion),
        };
      }
      if (certificateType === "Experience") {
        certificateData.experienceDetails = {
          ...initialData.experienceDetails, // Preserve any existing experience details
          companyName: form.companyName,
          role: form.role,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          duration: form.duration,
        };
      }
      if (certificateType === "IdentityProof") {
        certificateData.idDetails = {
          ...initialData.idDetails, // Preserve any existing identity details
          idType: form.idType,
          idNumber: form.idNumber,
          country: form.country,
          ...(form.idType === "PF" && { uanNumber: form.uanNumber }),
        };
      }
    } else {
      // In create mode, only send the form data
      certificateData = {
        title: form.title,
        issuingAuthority: form.issuingAuthority,
        issueDate: form.issueDate,
        expiryDate: form.expiryDate || undefined,
        certificateType,
        // Only include certificateId for Academic
        ...(certificateType === "Academic" && {
          certificateId: form.certificateId,
        }),
      };

      if (certificateType === "Academic") {
        certificateData.academicDetails = {
          qualificationType: form.qualificationType,
          fieldOfStudy: form.fieldOfStudy,
          grade: form.grade,
          institution: form.institution,
          yearOfCompletion: Number(form.yearOfCompletion),
        };
      }
      if (certificateType === "Experience") {
        certificateData.experienceDetails = {
          companyName: form.companyName,
          role: form.role,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          duration: form.duration,
        };
      }
      if (certificateType === "IdentityProof") {
        certificateData.idDetails = {
          idType: form.idType,
          idNumber: form.idNumber,
          country: form.country,
          ...(form.idType === "PF" && { uanNumber: form.uanNumber }),
        };
      }
    }

    dispatch("submit", { file, certificateData });
  }

  function handleFileSelect(event: CustomEvent) {
    file = event.detail.files[0];
    fileError = "";
  }
</script>

<div class="admin-cert-form">
  {#if isEditMode && initialData?.verificationStatus}
    <div class="flex justify-end p-2">
      <div
        class={`
                inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium
                transition-all duration-300 hover:scale-105 hover:shadow-lg
                backdrop-blur-sm bg-gradient-to-r
                ${statusInfo.gradient} ${statusInfo.ring} ${statusInfo.glow} ${statusInfo.class}
            `}
      >
        <span class="text-xs font-bold opacity-80">{statusInfo.icon}</span>
        <span class="tracking-wide">{initialData.verificationStatus}</span>
      </div>
    </div>
  {/if}
  <form on:submit|preventDefault={handleSubmit}>
    <fieldset class="form-section">
      <legend class="section-title">Certificate Info</legend>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">
            Certificate Type {#if isRequired("certificateType")}<span
                class="required">*</span
              >{/if}
          </label>
          <select
            class="input"
            bind:value={certificateType}
            disabled={isReadOnly}
          >
            <option value="Academic">Academic</option>
            <option value="Experience">Experience</option>
            <option value="IdentityProof">Identity Proof</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">
            Title {#if isRequired("title")}<span class="required">*</span>{/if}
          </label>
          <input
            class="input"
            type="text"
            bind:value={form.title}
            placeholder={titleHelpText}
            required
            disabled={isReadOnly}
            on:input={() => {
              if (errors.title && form.title) errors.title = "";
            }}
          />
          {#if errors.title}
            <div class="error-msg">{errors.title}</div>
          {/if}
        </div>
        <div class="form-group">
          <label class="form-label">
            Issuing Authority {#if isRequired("issuingAuthority")}<span
                class="required">*</span
              >{/if}
          </label>
          <input
            class="input"
            type="text"
            bind:value={form.issuingAuthority}
            required
            disabled={isReadOnly}
            on:input={() => {
              if (errors.issuingAuthority && form.issuingAuthority)
                errors.issuingAuthority = "";
            }}
          />
          {#if errors.issuingAuthority}<div class="error-msg">
              {errors.issuingAuthority}
            </div>{/if}
        </div>
        <div class="form-group">
          <label class="form-label">
            Issue Date {#if isRequired("issueDate")}<span class="required"
                >*</span
              >{/if}
          </label>
          <input
            class="input"
            type="date"
            bind:value={form.issueDate}
            required
            disabled={isReadOnly}
            on:input={() => {
              if (errors.issueDate && form.issueDate) errors.issueDate = "";
            }}
          />
          {#if errors.issueDate}<div class="error-msg">
              {errors.issueDate}
            </div>{/if}
        </div>
        <div class="form-group">
          <label class="form-label">Expiry Date (optional)</label>
          <input
            type="date"
            class="input"
            bind:value={form.endDate}
            disabled={isReadOnly}
          />
        </div>
        {#if certificateType === "Academic"}
          <div class="form-group">
            <label class="form-label">
              Certificate ID {#if isRequired("certificateId")}<span
                  class="required">*</span
                >{/if}
            </label>
            <input
              class="input"
              type="text"
              bind:value={form.certificateId}
              required
              disabled={isReadOnly}
              on:input={() => {
                if (errors.certificateId && form.certificateId)
                  errors.certificateId = "";
              }}
            />
            {#if errors.certificateId}<div class="error-msg">
                {errors.certificateId}
              </div>{/if}
          </div>
        {/if}
      </div>
    </fieldset>

    {#if certificateType === "Academic"}
      <fieldset class="form-section">
        <legend class="section-title">Academic Details</legend>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">
              Qualification Type {#if isRequired("qualificationType")}<span
                  class="required">*</span
                >{/if}
            </label>
            <select
              class="input"
              bind:value={form.qualificationType}
              required
              disabled={isReadOnly}
              on:change={() => {
                if (errors.qualificationType && form.qualificationType)
                  errors.qualificationType = "";
              }}
            >
              <option value="" disabled selected>Select qualification</option>
              {#each qualificationTypes as q}
                <option value={q.value}>{q.label}</option>
              {/each}
            </select>
            {#if errors.qualificationType}<div class="error-msg">
                {errors.qualificationType}
              </div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">
              Field of Study {#if isRequired("fieldOfStudy")}<span
                  class="required">*</span
                >{/if}
            </label>
            <input
              class="input"
              type="text"
              bind:value={form.fieldOfStudy}
              required
              disabled={isReadOnly}
              on:input={() => {
                if (errors.fieldOfStudy && form.fieldOfStudy)
                  errors.fieldOfStudy = "";
              }}
            />
            {#if errors.fieldOfStudy}<div class="error-msg">
                {errors.fieldOfStudy}
              </div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">Grade (optional)</label>
            <input
              class="input"
              type="text"
              bind:value={form.grade}
              disabled={isReadOnly}
            />
          </div>
          <div class="form-group">
            <label class="form-label">
              Institution {#if isRequired("institution")}<span class="required"
                  >*</span
                >{/if}
            </label>
            <input
              class="input"
              type="text"
              bind:value={form.institution}
              required
              disabled={isReadOnly}
              on:input={() => {
                if (errors.institution && form.institution)
                  errors.institution = "";
              }}
            />
            {#if errors.institution}<div class="error-msg">
                {errors.institution}
              </div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">
              Year of Completion {#if isRequired("yearOfCompletion")}<span
                  class="required">*</span
                >{/if}
            </label>
            <input
              class="input"
              type="number"
              min="1900"
              max="2100"
              bind:value={form.yearOfCompletion}
              required
              disabled={isReadOnly}
              on:input={() => {
                if (errors.yearOfCompletion && form.yearOfCompletion)
                  errors.yearOfCompletion = "";
              }}
            />
            {#if errors.yearOfCompletion}<div class="error-msg">
                {errors.yearOfCompletion}
              </div>{/if}
          </div>
        </div>
      </fieldset>
    {/if}

    {#if certificateType === "Experience"}
      <fieldset class="form-section">
        <legend class="section-title">Experience Details</legend>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">
              Company Name {#if isRequired("companyName")}<span class="required"
                  >*</span
                >{/if}
            </label>
            <input
              class="input"
              type="text"
              bind:value={form.companyName}
              required
              disabled={isReadOnly}
              on:input={() => {
                if (errors.companyName && form.companyName)
                  errors.companyName = "";
              }}
            />
            {#if errors.companyName}<div class="error-msg">
                {errors.companyName}
              </div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">
              Role {#if isRequired("role")}<span class="required">*</span>{/if}
            </label>
            <input
              class="input"
              type="text"
              bind:value={form.role}
              required
              disabled={isReadOnly}
              on:input={() => {
                if (errors.role && form.role) errors.role = "";
              }}
            />
            {#if errors.role}<div class="error-msg">
                {errors.role}
              </div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">
              Start Date {#if isRequired("startDate")}<span class="required"
                  >*</span
                >{/if}
            </label>
            <input
              class="input"
              type="date"
              bind:value={form.startDate}
              required
              disabled={isReadOnly}
              on:input={() => {
                if (errors.startDate && form.startDate) errors.startDate = "";
              }}
            />
            {#if errors.startDate}<div class="error-msg">
                {errors.startDate}
              </div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">End Date (optional)</label>
            <input
              class="input"
              type="date"
              bind:value={form.endDate}
              disabled={isReadOnly}
            />
          </div>
          <div class="form-group">
            <label class="form-label">Duration (optional)</label>
            <input
              class="input"
              type="text"
              bind:value={form.duration}
              disabled={isReadOnly}
            />
          </div>
        </div>
      </fieldset>
    {/if}

    {#if certificateType === "IdentityProof"}
      <fieldset class="form-section">
        <legend class="section-title">Identity Proof Details</legend>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">
              ID Type {#if isRequired("idType")}<span class="required">*</span
                >{/if}
            </label>
            <select
              class="input"
              bind:value={form.idType}
              required
              disabled={isReadOnly}
              on:change={() => {
                if (errors.idType && form.idType) errors.idType = "";
              }}
            >
              <option value="" disabled selected>Select ID type</option>
              {#each idTypes as t}
                <option value={t.value}>{t.label}</option>
              {/each}
            </select>
            {#if errors.idType}<div class="error-msg">
                {errors.idType}
              </div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">
              ID Number {#if isRequired("idNumber")}<span class="required"
                  >*</span
                >{/if}
            </label>
            <input
              class="input"
              type="text"
              bind:value={form.idNumber}
              required
              disabled={isReadOnly}
              on:input={() => {
                if (errors.idNumber && form.idNumber) errors.idNumber = "";
              }}
            />
            {#if errors.idNumber}<div class="error-msg">
                {errors.idNumber}
              </div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">Country (optional)</label>
            <input
              class="input"
              type="text"
              bind:value={form.country}
              disabled={isReadOnly}
            />
          </div>
          {#if form.idType === "PF"}
            <div class="form-group">
              <label class="form-label">
                UAN Number {#if isRequired("uanNumber")}<span class="required"
                    >*</span
                  >{/if}
              </label>
              <input
                class="input"
                type="text"
                bind:value={form.uanNumber}
                required
                disabled={isReadOnly}
                on:input={() => {
                  if (errors.uanNumber && form.uanNumber) errors.uanNumber = "";
                }}
              />
              {#if errors.uanNumber}<div class="error-msg">
                  {errors.uanNumber}
                </div>{/if}
            </div>
          {/if}
        </div>
      </fieldset>
    {/if}

    <fieldset class="form-section upload-section">
      <legend class="section-title">Upload Area</legend>
      <div class="upload-area">
        <label class="form-label mb-2">
          Certificate File {#if !isEditMode}<span class="required">*</span>{/if}
          {#if isEditMode}<span class="text-sm text-gray-500"
              >(Upload new file to replace current one)</span
            >{/if}
        </label>

        {#if isEditMode && currentFilePath}
          <div class="mb-4 border rounded-lg p-4 bg-gray-50">
            <h4 class="text-sm font-medium text-gray-700 mb-2">
              Current Document:
            </h4>
            <div class="document-preview">
              {#if currentFilePath
                .toLowerCase()
                .match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)}
                <!-- Image files -->
                <div class="image-preview">
                  <img
                    src={currentFilePath}
                    alt="Certificate preview"
                    class="w-full h-64 object-contain border rounded bg-white"
                  />
                </div>
              {:else if currentFilePath.toLowerCase().includes(".pdf")}
                <!-- PDF files -->
                <div class="pdf-preview">
                  <iframe
                    src={currentFilePath}
                    class="w-full h-64 border rounded"
                    title="PDF Certificate Document"
                  ></iframe>
                  <div class="file-type-indicator">
                    <svg
                      class="w-6 h-6 text-red-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
                      />
                    </svg>
                    <span class="text-xs text-red-600 font-medium">PDF</span>
                  </div>
                </div>
              {:else if currentFilePath.toLowerCase().match(/\.(doc|docx)$/)}
                <!-- Word documents -->
                <div class="document-fallback">
                  <div class="fallback-content">
                    <svg
                      class="w-16 h-16 text-blue-600 mx-auto mb-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
                      />
                    </svg>
                    <div class="text-center">
                      <p class="text-sm font-medium text-gray-700">
                        Word Document
                      </p>
                      <p class="text-xs text-gray-500 mt-1">
                        Click to view/download
                      </p>
                      <a
                        href={currentFilePath}
                        target="_blank"
                        rel="noopener"
                        class="inline-block mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        Open Document
                      </a>
                    </div>
                  </div>
                </div>
              {:else}
                <!-- Generic file fallback -->
                <div class="document-fallback">
                  <div class="fallback-content">
                    <svg
                      class="w-16 h-16 text-gray-600 mx-auto mb-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
                      />
                    </svg>
                    <div class="text-center">
                      <p class="text-sm font-medium text-gray-700">
                        Document File
                      </p>
                      <p class="text-xs text-gray-500 mt-1">
                        Click to view/download
                      </p>
                      <a
                        href={currentFilePath}
                        target="_blank"
                        rel="noopener"
                        class="inline-block mt-2 px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                      >
                        Open File
                      </a>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
            <p class="text-xs text-gray-500 mt-2">
              {currentFilePath.split("/").pop() || "Current document"}
            </p>
          </div>
        {/if}

        {#if !isReadOnly}
          {#if !isEditMode}
            <!-- Show file upload directly for new documents -->
            <FileUpload
              maxFiles={1}
              maxSize={10 * 1024 * 1024}
              on:upload={handleFileSelect}
            />
          {:else}
            <!-- Show toggle button for edit mode -->
            {#if !showFileUpload}
              <button
                type="button"
                class="upload-toggle-btn"
                on:click={() => (showFileUpload = true)}
              >
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload New File
              </button>
            {:else}
              <!-- Show file upload when toggle is active -->
              <div class="file-upload-container">
                <FileUpload
                  maxFiles={1}
                  maxSize={10 * 1024 * 1024}
                  on:upload={handleFileSelect}
                />
                <button
                  type="button"
                  class="cancel-upload-btn"
                  on:click={() => {
                    showFileUpload = false;
                    file = null;
                    fileError = "";
                  }}
                >
                  Cancel Upload
                </button>
              </div>
            {/if}
          {/if}

          {#if file}
            <p class="file-info" style="color: #059669;">
              New file selected: {file.name}
            </p>
            {#if file.type && file.type.startsWith("image/")}
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                class="file-preview"
              />
            {/if}
          {/if}
          {#if fileError}
            <p class="error-msg mt-2">{fileError}</p>
          {/if}
        {/if}
      </div>
    </fieldset>

    <div class="form-actions">
      <Button
        type="button"
        variant="outline"
        on:click={() => dispatch("cancel")}>Cancel</Button
      >
      {#if !isReadOnly}
        <Button type="submit" variant="primary" {loading}>
          {#if loading}{isEditMode
              ? "Updating..."
              : "Submitting..."}{:else}{isEditMode ? "Update" : "Submit"}{/if}
        </Button>
      {/if}
    </div>
  </form>
</div>

<style>
  .admin-cert-form {
    /* background: #e5e7eb; */
    /* border-radius: 1rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08); */
    padding: 1.5rem 1rem;
    max-width: 700px;
    margin: 0 auto;
    animation: fadeIn 0.4s;
    width: 100%;
  }
  form {
    margin: 0;
  }
  .form-section {
    border: none;
    background: none;
    border-radius: 0;
    margin-bottom: 1.2rem;
    padding: 0 0 0.5rem 0;
    box-shadow: none;
  }
  .upload-section {
    background: none;
    margin-bottom: 0.5rem;
    padding-bottom: 1.2rem;
  }
  .section-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.7rem;
    margin-top: 0;
    color: #2d3748;
    letter-spacing: 0.01em;
    /* padding-left: 0.1em; */
    /* border-bottom: 2px solid #e5e7eb; */
    /* padding-bottom: 0.3em; */
    /* margin-bottom: 1.1em; */
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.7rem 1.2rem;
    margin-bottom: 0.2rem;
  }
  @media (max-width: 700px) {
    .form-grid {
      grid-template-columns: 1fr;
      gap: 0.7rem 0.5rem;
    }
    .admin-cert-form {
      padding: 0.5rem 0.1rem;
    }
    .form-section {
      padding: 0.7rem 0.3rem 0.2rem 0.3rem;
    }
  }
  .form-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 0.1rem;
  }
  .form-label {
    font-weight: 500;
    margin-bottom: 0.2rem;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .required {
    color: #e53e3e;
    font-size: 1.1em;
    margin-left: 0.1em;
  }
  .input {
    width: 100%;
    padding: 0.5rem 0.65rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    font-size: 1rem;
    transition:
      border 0.2s,
      box-shadow 0.2s;
    background: #fff;
    margin-bottom: 0.05rem;
  }
  .input:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 2px #bee3f8;
    background: #fff;
  }
  .error-msg {
    color: #e53e3e;
    font-size: 0.92em;
    margin-top: 0.1em;
    transition: opacity 0.2s;
  }
  .file-info {
    font-size: 0.95em;
    color: #4b5563;
    margin-top: 0.5em;
  }
  .file-preview {
    margin-top: 0.5em;
    max-width: 120px;
    max-height: 120px;
    border-radius: 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    object-fit: cover;
    transition: transform 0.2s;
  }
  .file-preview:hover {
    transform: scale(1.04);
  }
  .upload-area {
    border-radius: 0.75rem;
    padding: 0.5rem 0.5rem 0 0.5rem;
    margin-bottom: 0.2rem;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    background: none;
  }
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1.2rem;
    margin-top: 1.2rem;
    flex-wrap: wrap;
  }
  @media (max-width: 500px) {
    .form-actions {
      flex-direction: column;
      gap: 0.7rem;
      align-items: stretch;
    }
  }
  .document-preview {
    position: relative;
    min-height: 256px;
  }
  .document-preview iframe {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    min-height: 256px;
  }
  .document-preview iframe:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  .image-preview img {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  .pdf-preview {
    position: relative;
  }
  .file-type-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    background: white;
    border-radius: 4px;
    padding: 4px 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .document-fallback {
    height: 256px;
    border: 2px dashed #d1d5db;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
  }
  .fallback-content {
    text-align: center;
    padding: 2rem;
  }

  .read-only-message {
    padding: 1rem;
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    text-align: center;
  }

  .input:disabled,
  .input[disabled] {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }

  .upload-toggle-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.75rem 1rem;
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    color: #374151;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .upload-toggle-btn:hover {
    background-color: #e5e7eb;
    border-color: #9ca3af;
  }

  .file-upload-container {
    background-color: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-top: 0.5rem;
  }

  .cancel-upload-btn {
    margin-top: 0.5rem;
    padding: 0.5rem 1rem;
    background-color: #fff;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    color: #6b7280;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-upload-btn:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }

  .status-bar {
    position: absolute;
    top: 1rem;
    right: 1rem;
    z-index: 10;
  }

  .admin-cert-form {
    position: relative;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  .status-pending {
    border-color: rgba(245, 158, 11, 0.3);
    color: #b45309;
    position: relative;
  }

  .status-pending::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      135deg,
      rgba(245, 158, 11, 0.1),
      rgba(217, 119, 6, 0.05)
    );
    pointer-events: none;
  }

  .status-verified {
    border-color: rgba(16, 185, 129, 0.3);
    color: #047857;
    position: relative;
  }

  .status-verified::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      135deg,
      rgba(16, 185, 129, 0.1),
      rgba(5, 150, 105, 0.05)
    );
    pointer-events: none;
  }

  .status-rejected {
    border-color: rgba(239, 68, 68, 0.3);
    color: #dc2626;
    position: relative;
  }

  .status-rejected::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      135deg,
      rgba(239, 68, 68, 0.1),
      rgba(220, 38, 38, 0.05)
    );
    pointer-events: none;
  }

  /* Optional: Add subtle animation for pending status */
  .status-pending {
    animation: pulse-glow 2s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.3);
    }
    50% {
      box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.1);
    }
  }
</style>
