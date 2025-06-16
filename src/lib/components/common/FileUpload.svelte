<!-- FileUpload.svelte -->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
  
    // Props for configuration
    export let accept = "*/*"; // File types: ".pdf,.doc,.docx" or "image/*" or "*/*"
    export let maxFiles = 5; // Maximum number of files
    export let maxSize = 10 * 1024 * 1024; // Maximum file size in bytes (default 10MB)
    export let multiple = true; // Allow multiple files
    export let confirmBeforeUpload = true; // Show confirmation dialog
    export let disabled = false;
    export let label = "Upload Files";
    export let description = "Drag and drop files here or click to browse";
  
    // Internal state
    let dragOver = false;
    let fileInput: HTMLInputElement;
    let selectedFiles: File[] = [];
    let showConfirmation = false;
    let errors: string[] = [];
    let uploading = false;
  
    const dispatch = createEventDispatcher();
  
    // Drag and drop handlers
    function handleDragOver(e: DragEvent) {
      e.preventDefault();
      if (!disabled) dragOver = true;
    }
  
    function handleDragLeave(e: DragEvent) {
      e.preventDefault();
      dragOver = false;
    }
  
    function handleDrop(e: DragEvent) {
      e.preventDefault();
      dragOver = false;
      if (disabled) return;
      
      const files = Array.from(e.dataTransfer?.files || []);
      handleFileSelection(files);
    }
  
    // File input change handler
    function handleFileInputChange(e: Event) {
      const target = e.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      handleFileSelection(files);
    }
  
    // File validation and selection
    function handleFileSelection(files: File[]) {
      errors = [];
      const validFiles: File[] = [];
  
      // Check file count
      if (files.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }
  
      // Validate each file
      files.forEach((file, index) => {
        // Check file size
        if (file.size > maxSize) {
          errors.push(`${file.name}: File size exceeds ${formatFileSize(maxSize)}`);
          return;
        }
  
        // Check file type if specified
        if (accept !== "*/*" && !isFileTypeAllowed(file)) {
          errors.push(`${file.name}: File type not allowed`);
          return;
        }
  
        validFiles.push(file);
      });
  
      if (validFiles.length > 0) {
        selectedFiles = validFiles;
        if (confirmBeforeUpload) {
          showConfirmation = true;
        } else {
          confirmUpload();
        }
      }
    }
  
    // Check if file type is allowed
    function isFileTypeAllowed(file: File): boolean {
      if (accept === "*/*") return true;
      
      const acceptedTypes = accept.split(",").map(type => type.trim());
      
      return acceptedTypes.some(type => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        } else if (type.includes("/*")) {
          const category = type.split("/")[0];
          return file.type.startsWith(category);
        } else {
          return file.type === type;
        }
      });
    }
  
    // Format file size for display
    function formatFileSize(bytes: number): string {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }
  
    // Get file extension for icon
    function getFileType(file: File): string {
      if (file.type.startsWith("image/")) return "image";
      if (file.type.includes("pdf")) return "pdf";
      if (file.type.includes("word") || file.name.endsWith(".doc") || file.name.endsWith(".docx")) return "doc";
      if (file.type.includes("excel") || file.name.endsWith(".xls") || file.name.endsWith(".xlsx")) return "excel";
      if (file.type.includes("text")) return "text";
      return "file";
    }
  
    // Confirm upload
    function confirmUpload() {
      uploading = true;
      showConfirmation = false;
      
      // Simulate upload process (replace with actual upload logic)
      setTimeout(() => {
        dispatch("upload", { files: selectedFiles });
        uploading = false;
        selectedFiles = [];
        if (fileInput) fileInput.value = "";
      }, 1000);
    }
  
    // Cancel upload
    function cancelUpload() {
      showConfirmation = false;
      selectedFiles = [];
      if (fileInput) fileInput.value = "";
    }
  
    // Remove file from selection
    function removeFile(index: number) {
      selectedFiles = selectedFiles.filter((_, i) => i !== index);
    }
  
    // Clear errors
    function clearErrors() {
      errors = [];
    }
  
    // Click to browse
    function triggerFileInput() {
      if (!disabled) {
        fileInput?.click();
      }
    }
  </script>
  
  <!-- Main Upload Area -->
  <div class="w-full space-y-4">
    <!-- Upload Zone -->
    <div
      class="relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
             {dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
             {disabled ? 'opacity-50 cursor-not-allowed' : ''}
             {uploading ? 'pointer-events-none' : ''}"
      on:dragover={handleDragOver}
      on:dragleave={handleDragLeave}
      on:drop={handleDrop}
      on:click={triggerFileInput}
      role="button"
      tabindex="0"
    >
      <!-- Cloud Upload Icon -->
      <div class="mb-4 flex justify-center">
        <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
  
      <!-- Upload Text -->
      <div class="space-y-2">
        <h3 class="text-lg font-medium text-gray-900">{label}</h3>
        <p class="text-sm text-gray-600">{description}</p>
        <p class="text-xs text-gray-500">
          {#if accept !== "*/*"}
            Accepted formats: {accept}
          {/if}
          {#if maxFiles > 1}
            • Max {maxFiles} files
          {/if}
          • Max size: {formatFileSize(maxSize)} per file
        </p>
      </div>
  
      <!-- Loading Indicator -->
      {#if uploading}
        <div class="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-xl">
          <div class="flex items-center space-x-2">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span class="text-sm font-medium text-gray-700">Uploading...</span>
          </div>
        </div>
      {/if}
    </div>
  
    <!-- Hidden File Input -->
    <input
      bind:this={fileInput}
      type="file"
      {accept}
      {multiple}
      {disabled}
      class="hidden"
      on:change={handleFileInputChange}
    />
  
    <!-- Error Messages -->
    {#if errors.length > 0}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3 flex-1">
            <h3 class="text-sm font-medium text-red-800">Upload Error</h3>
            <div class="mt-2 text-sm text-red-700">
              <ul class="list-disc list-inside space-y-1">
                {#each errors as error}
                  <li>{error}</li>
                {/each}
              </ul>
            </div>
          </div>
          <button
            on:click={clearErrors}
            class="ml-3 flex-shrink-0 text-red-400 hover:text-red-600"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Confirmation Modal -->
  {#if showConfirmation}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full max-h-96 overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Confirm File Upload</h3>
          <p class="text-sm text-gray-600 mt-1">Review files before uploading</p>
        </div>
  
        <!-- File List -->
        <div class="px-6 py-4 max-h-60 overflow-y-auto">
          <div class="space-y-3">
            {#each selectedFiles as file, index}
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center space-x-3">
                  <!-- File Type Icon -->
                  <div class="flex-shrink-0">
                    {#if getFileType(file) === "image"}
                      <svg class="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                      </svg>
                    {:else if getFileType(file) === "pdf"}
                      <svg class="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
                      </svg>
                    {:else}
                      <svg class="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd" />
                      </svg>
                    {/if}
                  </div>
                  
                  <!-- File Info -->
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p class="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
  
                <!-- Remove Button -->
                <button
                  on:click={() => removeFile(index)}
                  class="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            {/each}
          </div>
        </div>
  
        <!-- Actions -->
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            on:click={cancelUpload}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            on:click={confirmUpload}
            disabled={selectedFiles.length === 0}
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  {/if}
  
  <style>
    /* Custom scrollbar for file list */
    .max-h-60::-webkit-scrollbar {
      width: 6px;
    }
    
    .max-h-60::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }
    
    .max-h-60::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }
    
    .max-h-60::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  </style>