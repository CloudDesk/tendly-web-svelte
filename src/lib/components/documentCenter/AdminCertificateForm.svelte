<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '$lib/components/common/Button.svelte';
  import FileUpload from '$lib/components/common/FileUpload.svelte';

  export let loading = false;

  const dispatch = createEventDispatcher();

  let certificateType: 'Academic' | 'Experience' | 'IdentityProof' = 'Academic';
  let file: File | null = null;
  let fileError = '';
  let form = {
    // Common
    title: '',
    issuingAuthority: '',
    issueDate: '',
    expiryDate: '',
    certificateId: '',
    // Academic
    qualificationType: '',
    fieldOfStudy: '',
    grade: '',
    institution: '',
    yearOfCompletion: '',
    // Experience
    companyName: '',
    role: '',
    startDate: '',
    endDate: '',
    duration: '',
    // IdentityProof
    idType: '',
    idNumber: '',
    country: '',
    uanNumber: '', // For PF only
  };
  let errors: Record<string, string> = {};

  // Enum options for Academic
  const qualificationTypes = [
    { value: 'Secondary', label: 'Secondary (10th)' },
    { value: 'HigherSecondary', label: 'Higher Secondary (12th)' },
    { value: 'Diploma', label: 'Diploma' },
    { value: 'Bachelor', label: 'Bachelor' },
    { value: 'Master', label: 'Master' },
    { value: 'Doctorate', label: 'Doctorate' },
    { value: 'Other', label: 'Other' }
  ];

  // Enum options for IdentityProof (now includes PF)
  const idTypes = [
    { value: 'Aadhaar', label: 'Aadhaar' },
    { value: 'PAN', label: 'PAN' },
    { value: 'Passport', label: 'Passport' },
    { value: 'DriverLicense', label: 'Driver License' },
    { value: 'VoterID', label: 'Voter ID' },
    { value: 'PF', label: 'Provident Fund (PF)' },
    { value: 'Other', label: 'Other' }
  ];

  // Helper to determine if a field is required for the current certificate type
  function isRequired(field: string) {
    if (["title", "issuingAuthority", "issueDate"].includes(field)) return true;
    if (certificateType === "Academic") {
      return ["qualificationType", "fieldOfStudy", "institution", "yearOfCompletion", "certificateId"].includes(field);
    }
    if (certificateType === "Experience") {
      return ["companyName", "role", "startDate"].includes(field);
    }
    if (certificateType === "IdentityProof") {
      if (field === "uanNumber") return form.idType === "PF";
      return ["idType", "idNumber", "certificateId"].includes(field);
    }
    return false;
  }

  // Real-time error clearing for each field
  $: if (errors.title && form.title) errors.title = "";
  $: if (errors.issuingAuthority && form.issuingAuthority) errors.issuingAuthority = "";
  $: if (errors.issueDate && form.issueDate) errors.issueDate = "";
  $: if (errors.qualificationType && form.qualificationType) errors.qualificationType = "";
  $: if (errors.fieldOfStudy && form.fieldOfStudy) errors.fieldOfStudy = "";
  $: if (errors.institution && form.institution) errors.institution = "";
  $: if (errors.yearOfCompletion && form.yearOfCompletion) errors.yearOfCompletion = "";
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
    if (!form.title) errors.title = 'Required';
    if (!form.issuingAuthority) errors.issuingAuthority = 'Required';
    if (!form.issueDate) errors.issueDate = 'Required';
    // File
    if (!file) fileError = 'Certificate file required';
    else fileError = '';
    // Type-specific
    if (certificateType === 'Academic') {
      if (!form.qualificationType) errors.qualificationType = 'Required';
      if (!form.fieldOfStudy) errors.fieldOfStudy = 'Required';
      if (!form.institution) errors.institution = 'Required';
      if (!form.yearOfCompletion) errors.yearOfCompletion = 'Required';
      if (!form.certificateId) errors.certificateId = 'Certificate ID is required';
    }
    if (certificateType === 'Experience') {
      if (!form.companyName) errors.companyName = 'Required';
      if (!form.role) errors.role = 'Required';
      if (!form.startDate) errors.startDate = 'Required';
    }
    if (certificateType === 'IdentityProof') {
      if (!form.idType) errors.idType = 'Required';
      if (!form.idNumber) errors.idNumber = 'Required';
      if (form.idType === 'PF' && !form.uanNumber) errors.uanNumber = 'UAN Number is required for PF';
      if (!form.certificateId) errors.certificateId = 'Certificate ID is required';
    }
    return Object.keys(errors).length === 0 && !fileError;
  }

  function handleSubmit() {
    if (!validate()) return;
    let certificateData: any = {
      title: form.title,
      issuingAuthority: form.issuingAuthority,
      issueDate: form.issueDate,
      expiryDate: form.expiryDate || undefined,
      certificateType,
      certificateId: form.certificateId,
    };
    if (certificateType === 'Academic') {
      certificateData.academicDetails = {
        qualificationType: form.qualificationType,
        fieldOfStudy: form.fieldOfStudy,
        grade: form.grade,
        institution: form.institution,
        yearOfCompletion: Number(form.yearOfCompletion),
      };
    }
    if (certificateType === 'Experience') {
      certificateData.experienceDetails = {
        companyName: form.companyName,
        role: form.role,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        duration: form.duration,
      };
    }
    if (certificateType === 'IdentityProof') {
      certificateData.idDetails = {
        idType: form.idType,
        idNumber: form.idNumber,
        country: form.country,
        ...(form.idType === 'PF' && { uanNumber: form.uanNumber })
      };
    }
    dispatch('submit', { file, certificateData });
  }

  function handleFileSelect(event) {
    file = event.detail.files[0];
    fileError = '';
  }
</script>

<div class="admin-cert-form">
  <form on:submit|preventDefault={handleSubmit}>
    <fieldset class="form-section">
      <legend class="section-title">Certificate Info</legend>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">
            Certificate Type {#if isRequired('certificateType')}<span class="required">*</span>{/if}
          </label>
          <select class="input" bind:value={certificateType}>
            <option value="Academic">Academic</option>
            <option value="Experience">Experience</option>
            <option value="IdentityProof">Identity Proof</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">
            Title {#if isRequired('title')}<span class="required">*</span>{/if}
          </label>
          <input class="input" type="text" bind:value={form.title} placeholder="e.g. B.Tech Computer Science" required on:input={() => { if (errors.title && form.title) errors.title = ''; }} />
          {#if errors.title}
            <div class="error-msg">{errors.title}</div>
          {/if}
        </div>
        <div class="form-group">
          <label class="form-label">
            Issuing Authority {#if isRequired('issuingAuthority')}<span class="required">*</span>{/if}
          </label>
          <input class="input" type="text" bind:value={form.issuingAuthority} required on:input={() => { if (errors.issuingAuthority && form.issuingAuthority) errors.issuingAuthority = ''; }} />
          {#if errors.issuingAuthority}<div class="error-msg">{errors.issuingAuthority}</div>{/if}
        </div>
        <div class="form-group">
          <label class="form-label">
            Issue Date {#if isRequired('issueDate')}<span class="required">*</span>{/if}
          </label>
          <input class="input" type="date" bind:value={form.issueDate} required on:input={() => { if (errors.issueDate && form.issueDate) errors.issueDate = ''; }} />
          {#if errors.issueDate}<div class="error-msg">{errors.issueDate}</div>{/if}
        </div>
        <div class="form-group">
          <label class="form-label">Expiry Date (optional)</label>
          <input class="input" type="date" bind:value={form.expiryDate} />
        </div>
        {#if certificateType === 'Academic' || certificateType === 'IdentityProof'}
          <div class="form-group">
            <label class="form-label">
              Certificate ID {#if isRequired('certificateId')}<span class="required">*</span>{/if}
            </label>
            <input class="input" type="text" bind:value={form.certificateId} required on:input={() => { if (errors.certificateId && form.certificateId) errors.certificateId = ''; }} />
            {#if errors.certificateId}<div class="error-msg">{errors.certificateId}</div>{/if}
          </div>
        {/if}
      </div>
    </fieldset>

    {#if certificateType === 'Academic'}
      <fieldset class="form-section">
        <legend class="section-title">Academic Details</legend>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">
              Qualification Type {#if isRequired('qualificationType')}<span class="required">*</span>{/if}
            </label>
            <select class="input" bind:value={form.qualificationType} required on:change={() => { if (errors.qualificationType && form.qualificationType) errors.qualificationType = ''; }}>
              <option value="" disabled selected>Select qualification</option>
              {#each qualificationTypes as q}
                <option value={q.value}>{q.label}</option>
              {/each}
            </select>
            {#if errors.qualificationType}<div class="error-msg">{errors.qualificationType}</div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">
              Field of Study {#if isRequired('fieldOfStudy')}<span class="required">*</span>{/if}
            </label>
            <input class="input" type="text" bind:value={form.fieldOfStudy} required on:input={() => { if (errors.fieldOfStudy && form.fieldOfStudy) errors.fieldOfStudy = ''; }} />
            {#if errors.fieldOfStudy}<div class="error-msg">{errors.fieldOfStudy}</div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">Grade (optional)</label>
            <input class="input" type="text" bind:value={form.grade} />
          </div>
          <div class="form-group">
            <label class="form-label">
              Institution {#if isRequired('institution')}<span class="required">*</span>{/if}
            </label>
            <input class="input" type="text" bind:value={form.institution} required on:input={() => { if (errors.institution && form.institution) errors.institution = ''; }} />
            {#if errors.institution}<div class="error-msg">{errors.institution}</div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">
              Year of Completion {#if isRequired('yearOfCompletion')}<span class="required">*</span>{/if}
            </label>
            <input class="input" type="number" min="1900" max="2100" bind:value={form.yearOfCompletion} required on:input={() => { if (errors.yearOfCompletion && form.yearOfCompletion) errors.yearOfCompletion = ''; }} />
            {#if errors.yearOfCompletion}<div class="error-msg">{errors.yearOfCompletion}</div>{/if}
          </div>
        </div>
      </fieldset>
    {/if}

    {#if certificateType === 'Experience'}
      <fieldset class="form-section">
        <legend class="section-title">Experience Details</legend>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">
              Company Name {#if isRequired('companyName')}<span class="required">*</span>{/if}
            </label>
            <input class="input" type="text" bind:value={form.companyName} required on:input={() => { if (errors.companyName && form.companyName) errors.companyName = ''; }} />
            {#if errors.companyName}<div class="error-msg">{errors.companyName}</div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">
              Role {#if isRequired('role')}<span class="required">*</span>{/if}
            </label>
            <input class="input" type="text" bind:value={form.role} required on:input={() => { if (errors.role && form.role) errors.role = ''; }} />
            {#if errors.role}<div class="error-msg">{errors.role}</div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">
              Start Date {#if isRequired('startDate')}<span class="required">*</span>{/if}
            </label>
            <input class="input" type="date" bind:value={form.startDate} required on:input={() => { if (errors.startDate && form.startDate) errors.startDate = ''; }} />
            {#if errors.startDate}<div class="error-msg">{errors.startDate}</div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">End Date (optional)</label>
            <input class="input" type="date" bind:value={form.endDate} />
          </div>
          <div class="form-group">
            <label class="form-label">Duration (optional)</label>
            <input class="input" type="text" bind:value={form.duration} />
          </div>
        </div>
      </fieldset>
    {/if}

    {#if certificateType === 'IdentityProof'}
      <fieldset class="form-section">
        <legend class="section-title">Identity Proof Details</legend>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">
              ID Type {#if isRequired('idType')}<span class="required">*</span>{/if}
            </label>
            <select class="input" bind:value={form.idType} required on:change={() => { if (errors.idType && form.idType) errors.idType = ''; }}>
              <option value="" disabled selected>Select ID type</option>
              {#each idTypes as t}
                <option value={t.value}>{t.label}</option>
              {/each}
            </select>
            {#if errors.idType}<div class="error-msg">{errors.idType}</div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">
              ID Number {#if isRequired('idNumber')}<span class="required">*</span>{/if}
            </label>
            <input class="input" type="text" bind:value={form.idNumber} required on:input={() => { if (errors.idNumber && form.idNumber) errors.idNumber = ''; }} />
            {#if errors.idNumber}<div class="error-msg">{errors.idNumber}</div>{/if}
          </div>
          <div class="form-group">
            <label class="form-label">Country (optional)</label>
            <input class="input" type="text" bind:value={form.country} />
          </div>
          {#if form.idType === 'PF'}
            <div class="form-group">
              <label class="form-label">
                UAN Number {#if isRequired('uanNumber')}<span class="required">*</span>{/if}
              </label>
              <input class="input" type="text" bind:value={form.uanNumber} required on:input={() => { if (errors.uanNumber && form.uanNumber) errors.uanNumber = ''; }} />
              {#if errors.uanNumber}<div class="error-msg">{errors.uanNumber}</div>{/if}
            </div>
          {/if}
        </div>
      </fieldset>
    {/if}

    <fieldset class="form-section upload-section">
      <legend class="section-title">Upload Area</legend>
      <div class="upload-area">
        <label class="form-label mb-2">
          Certificate File <span class="required">*</span>
        </label>
        <FileUpload maxFiles={1} on:upload={handleFileSelect} accept="application/pdf,image/*" />
        {#if file}
          <p class="file-info">Selected: {file.name}</p>
          {#if file.type && file.type.startsWith('image/')}
            <img src={URL.createObjectURL(file)} alt="Preview" class="file-preview" />
          {/if}
        {/if}
        {#if fileError}
          <p class="error-msg mt-2">{fileError}</p>
        {/if}
      </div>
    </fieldset>

    <div class="form-actions">
      <Button type="button" variant="outline" on:click={() => dispatch('cancel')}>Cancel</Button>
      <Button type="submit" variant="primary" {loading}>
        {#if loading}Submitting...{:else}Submit{/if}
      </Button>
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
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
    font-size: 1rem;
    transition: border 0.2s, box-shadow 0.2s;
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
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
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
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
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
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: none; }
  }
</style>
