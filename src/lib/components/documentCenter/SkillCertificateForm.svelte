<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import Button from "$lib/components/common/Button.svelte";
    import FileUpload from "$lib/components/common/FileUpload.svelte";

    export let loading = false;
    export let initialData = null;
    export let currentFilePath = null;

    const dispatch = createEventDispatcher();

    let title = initialData?.title || "";
    let issuingAuthority = initialData?.issuingAuthority || "";
    let issueDate = initialData?.issueDate || "";
    let expiryDate = initialData?.expiryDate || "";
    let skillName = initialData?.skillDetails?.skillName || "";
    let proficiencyLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert" =
        initialData?.skillDetails?.proficiencyLevel || "Beginner";
    let category: "Technical" | "Soft" =
        initialData?.skillDetails?.category || "Technical";
    let file: File | null = null;
    let fileError = "";

    // Check if we're in edit mode
    $: isEditMode = !!initialData;

    // Check if form should be read-only based on verification status
    $: isReadOnly =
        initialData?.verificationStatus &&
        initialData.verificationStatus !== "Pending";

    function handleSubmit() {
        fileError = "";
        if (!file && !isEditMode) {
            fileError = "A certificate file is required.";
            return;
        }

        let certificateData;

        if (isEditMode && initialData) {
            // In edit mode, preserve all existing data and only update changed fields
            certificateData = {
                ...initialData, // Preserve all existing data
                title,
                issuingAuthority,
                issueDate,
                expiryDate: expiryDate || undefined,
                skillDetails: {
                    ...initialData.skillDetails, // Preserve any existing skill details
                    skillName,
                    proficiencyLevel,
                    category,
                },
            };
        } else {
            // In create mode, only send the form data
            certificateData = {
                title,
                issuingAuthority,
                issueDate,
                expiryDate: expiryDate || undefined,
                skillDetails: {
                    skillName,
                    proficiencyLevel,
                    category,
                },
                certificateType: "Skill", // Set for new certificates
            };
        }

        dispatch("submit", {
            file,
            certificateData,
        });
    }

    function handleFileSelect(event: CustomEvent) {
        if (event.detail.files.length > 0) {
            file = event.detail.files[0];
            fileError = "";
        }
    }
</script>

<form on:submit|preventDefault={handleSubmit}>
    <div class="space-y-4">
        <div>
            <label for="title" class="block text-sm font-medium text-gray-700"
                >Certificate Title</label
            >
            <input
                type="text"
                id="title"
                bind:value={title}
                required
                disabled={isReadOnly}
                class="input"
            />
        </div>
        <div>
            <label
                for="issuingAuthority"
                class="block text-sm font-medium text-gray-700"
                >Issuing Authority</label
            >
            <input
                type="text"
                id="issuingAuthority"
                bind:value={issuingAuthority}
                required
                disabled={isReadOnly}
                class="input"
            />
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label
                    for="issueDate"
                    class="block text-sm font-medium text-gray-700"
                    >Issue Date</label
                >
                <input
                    type="date"
                    id="issueDate"
                    bind:value={issueDate}
                    required
                    disabled={isReadOnly}
                    class="input"
                />
            </div>
            <div>
                <label
                    for="expiryDate"
                    class="block text-sm font-medium text-gray-700"
                    >Expiry Date (Optional)</label
                >
                <input
                    type="date"
                    id="expiryDate"
                    bind:value={expiryDate}
                    disabled={isReadOnly}
                    class="input"
                />
            </div>
        </div>
        <hr />
        <h3 class="text-lg font-medium">Skill Details</h3>
        <div>
            <label
                for="skillName"
                class="block text-sm font-medium text-gray-700"
                >Skill Name</label
            >
            <input
                type="text"
                id="skillName"
                bind:value={skillName}
                required
                disabled={isReadOnly}
                class="input"
            />
        </div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label
                    for="proficiencyLevel"
                    class="block text-sm font-medium text-gray-700"
                    >Proficiency Level</label
                >
                <select
                    id="proficiencyLevel"
                    bind:value={proficiencyLevel}
                    disabled={isReadOnly}
                    class="select"
                >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                </select>
            </div>
            <div>
                <label
                    for="category"
                    class="block text-sm font-medium text-gray-700"
                    >Category</label
                >
                <select
                    id="category"
                    bind:value={category}
                    disabled={isReadOnly}
                    class="select"
                >
                    <option value="Technical">Technical</option>
                    <option value="Soft">Soft</option>
                </select>
            </div>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
                Certificate File {#if !isEditMode}<span class="text-red-500"
                        >*</span
                    >{/if}
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
                        {:else if currentFilePath
                            .toLowerCase()
                            .includes(".pdf")}
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
                                    <span
                                        class="text-xs text-red-600 font-medium"
                                        >PDF</span
                                    >
                                </div>
                            </div>
                        {:else if currentFilePath
                            .toLowerCase()
                            .match(/\.(doc|docx)$/)}
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
                                        <p
                                            class="text-sm font-medium text-gray-700"
                                        >
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
                                        <p
                                            class="text-sm font-medium text-gray-700"
                                        >
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
                <FileUpload
                    maxFiles={1}
                    maxSize={2 * 1024 * 1024}
                    multiple={false}
                    confirmBeforeUpload={false}
                    on:upload={handleFileSelect}
                    accept="application/pdf,image/*"
                />
                {#if file}
                    <p class="text-sm text-green-600 mt-2">
                        New file selected: {file.name}
                    </p>
                {/if}
                {#if fileError}
                    <p class="text-sm text-red-600 mt-2">{fileError}</p>
                {/if}
            {:else}
                <div class="read-only-message">
                    <p class="text-sm text-gray-600">
                        This document has been {initialData?.verificationStatus?.toLowerCase()}
                        and cannot be modified.
                    </p>
                </div>
            {/if}
        </div>
    </div>
    <div class="mt-6 flex justify-end gap-4">
        <Button
            type="button"
            variant="outline"
            on:click={() => dispatch("cancel")}>Cancel</Button
        >
        {#if !isReadOnly}
            <Button type="submit" variant="primary" {loading}>
                {#if loading}{isEditMode
                        ? "Updating..."
                        : "Submitting..."}{:else}{isEditMode
                        ? "Update"
                        : "Submit"}{/if}
            </Button>
        {/if}
    </div>
</form>

<style>
    .input {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 0.25rem;
    }
    .select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 0.25rem;
        background-color: white;
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
    .select:disabled {
        background-color: #f9fafb;
        color: #6b7280;
        cursor: not-allowed;
    }
</style>
