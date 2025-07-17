<script lang="ts">
  import { documentsApi } from "$lib/services/api";
  import { AlertCircle, CheckCircle } from "lucide-svelte";
  import Button from "../common/Button.svelte";
  import FileUpload from "../common/FileUpload.svelte";
  import Modal from "../common/Modal.svelte";
  import { toast } from "../common/stores/toast.store";
  import { getCurrentFinancialYear } from "$lib/utils/financialYear";

  let isSubmitting = false;
  let showModal = false;
  let selectedFile: File | null = null;
  let uploadResult: any = null;

  // Automatically computed financial year string
  const currentFinancialYear = getCurrentFinancialYear(); // e.g. "2024-2025"

  const handleFileUpload = async (event: CustomEvent) => {
    const files = event.detail.files as File[];
    isSubmitting = true;
    uploadResult = null;
    selectedFile = files[0];
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("financialYear", currentFinancialYear); // ✅ auto FY

      const result = await documentsApi.uploadForm16Zip(formData);
      uploadResult = result;

      if (result.success) {
        toast.success(`Form 16 uploaded successfully. ${result.processed.length} employees mapped.`);
      } else {
        toast.error(result.error.message || "Some files had issues. Please check below.");
      }
    } catch (error:any) {
      toast.error(error.message || "Upload failed. Please try again.");
    } finally {
      isSubmitting = false;
    }
  };

  const handleUpload = () => {
    showModal = true;
    uploadResult = null;
  };

  function resetUpload() {
    uploadResult = null;
    selectedFile = null;
  }
</script>


<!-- Upload Button -->
<div>
  <div class="flex justify-end items-center mb-4">
    <!-- <h2 class="text-xl font-semibold">Documents</h2> -->
   
    <Button variant="primary" on:click={handleUpload}>Upload Form16 </Button>
  </div>
</div>

<!-- Modal -->
{#if showModal}
  <Modal
    title="Upload Form16 Zip"
    show={showModal}
    onClose={() => {
      showModal = false;
      uploadResult = null;
    }}
    wide={!uploadResult?false:true}
  >
    <div class="min-h-[40vh] p-6 w-full">
      {#if !uploadResult}
        <FileUpload
          accept=".zip"
          maxFiles={1}
          maxSize={100 * 1024 * 1024}
          multiple={false}
          label="Upload Form16 Zip File"
          description="Drag and drop your .zip file here or click to browse"
          disabled={isSubmitting}
          confirmBeforeUpload={false}
          on:upload={handleFileUpload}
        />
      {:else if !uploadResult.success}
        <!-- Error + Valid Rows -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Validation Results</h3>
            <div class="text-sm text-gray-600">
              {uploadResult.validFiles?.length || 0} valid / {(uploadResult.validFiles?.length || 0) + (uploadResult.errors?.length || 0)} total files
            </div>
          </div>

          <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div class="flex items-center">
              <AlertCircle class="h-5 w-5 text-yellow-600 mr-2" />
              <span class="text-yellow-800">Some files have validation errors. Please review and re-upload.</span>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg overflow-hidden">
            <div class="overflow-x-auto max-h-[60vh]">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icon</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each uploadResult.validFiles as file}
                    <tr class="bg-green-50">
                      <td class="px-4 py-3"><CheckCircle class="h-5 w-5 text-green-500" /></td>
                      <td class="px-4 py-3 font-mono">{file.fileName}</td>
                      <td class="px-4 py-3 text-green-700 font-semibold">Processed</td>
                      <td class="px-4 py-3">
                        {#if file.user}
                          <div class="font-medium">{file.user.name}</div>
                          <div class="text-xs text-gray-500">{file.user.email}</div>
                        {:else}
                          <span class="text-gray-400">-</span>
                        {/if}
                      </td>
                      <td class="px-4 py-2 text-green-700">OK</td>
                    </tr>
                  {/each}
                  {#each uploadResult.errors as err}
                    <tr class="bg-red-50">
                      <td class="px-4 py-3"><AlertCircle class="h-5 w-5 text-red-500" /></td>
                      <td class="px-4 py-3 font-mono">{err.fileName}</td>
                      <td class="px-4 py-2 text-red-700 font-semibold">Error</td>
                      <td class="px-4 py-2">-</td>
                      <td class="px-4 py-2 text-red-700">{err.error}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

           
          </div>
          <div class="flex justify-end mt-4 gap-2">
            <Button variant="primary" on:click={resetUpload}>Re-upload</Button>
            <Button variant="text" on:click={() => { showModal = false; uploadResult = null; }}>Close</Button>
          </div>
        </div>
      {:else if uploadResult.success}
        <!-- Success Table -->
        <div class="w-full border rounded-lg overflow-hidden">
          <div class="overflow-x-auto max-h-[60vh]">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">PAN</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {#each uploadResult.processed as file}
                  <tr class="bg-green-50">
                    <td class="px-4 py-2 font-mono">{file.fileName}</td>
                    <td class="px-4 py-2">{file.pan}</td>
                    <td class="px-4 py-2">
                      {#if file.user}
                        <div class="font-medium">{file.user.name}</div>
                        <div class="text-xs text-gray-500">{file.user.email}</div>
                      {:else}
                        <span class="text-gray-400">-</span>
                      {/if}
                    </td>
                    <td class="px-4 py-2 text-green-700 font-semibold">Processed</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </div>
  </Modal>
{/if}
