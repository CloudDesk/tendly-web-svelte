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
    let showFileUpload = false;

    // Check if we're in edit mode
    $: isEditMode = !!initialData;

    // Check if form should be read-only based on verification status
    $: isReadOnly =
        initialData?.verificationStatus &&
        initialData.verificationStatus !== "Pending";

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

    $: statusInfo = statusConfig[initialData.verificationStatus];

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

<div class="skill-cert-form">
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
                <span class="text-xs font-bold opacity-80"
                    >{statusInfo.icon}</span
                >
                <span class="tracking-wide"
                    >{initialData.verificationStatus}</span
                >
            </div>
        </div>
    {/if}
    <form on:submit|preventDefault={handleSubmit}>
        <div class="space-y-4">
            <div>
                <label
                    for="title"
                    class="block text-sm font-medium text-gray-700"
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
                                            <p
                                                class="text-xs text-gray-500 mt-1"
                                            >
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
                                            <p
                                                class="text-xs text-gray-500 mt-1"
                                            >
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
                            {currentFilePath.split("/").pop() ||
                                "Current document"}
                        </p>
                    </div>
                {/if}

                {#if !isReadOnly}
                    {#if !isEditMode}
                        <!-- Show file upload directly for new documents -->
                        <FileUpload
                            maxFiles={1}
                            maxSize={2 * 1024 * 1024}
                            multiple={false}
                            confirmBeforeUpload={false}
                            on:upload={handleFileSelect}
                            accept="application/pdf,image/*"
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
                                    maxSize={2 * 1024 * 1024}
                                    multiple={false}
                                    confirmBeforeUpload={false}
                                    on:upload={handleFileSelect}
                                    accept="application/pdf,image/*"
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
                        <p class="text-sm text-green-600 mt-2">
                            New file selected: {file.name}
                        </p>
                    {/if}
                    {#if fileError}
                        <p class="text-sm text-red-600 mt-2">{fileError}</p>
                    {/if}
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
</div>

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

    form {
        position: relative;
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
    .skill-cert-form {
        padding: 1.5rem 1rem;
        max-width: 700px;
        margin: 0 auto;
        animation: fadeIn 0.4s;
        width: 100%;
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
