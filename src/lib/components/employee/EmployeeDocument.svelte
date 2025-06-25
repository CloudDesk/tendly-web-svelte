<script lang="ts">
  import { getAccessConfig } from "$lib/utils/document";
  import Modal from "../common/Modal.svelte";
  import AdminCertificateForm from "../documentCenter/AdminCertificateForm.svelte";
  import DocumentViewer from "../documentCenter/DocumentViewer.svelte";


 export let access: 'own' | 'team' | 'global' = 'global';
export let employeeId;
  // Configuration based on access type
  $: config = getAccessConfig(access);

  let refreshKey = 0;
let showAddCertificateModal=false;
let isLoading=false;

  function handlePreview(event:CustomEvent) {
    const { docId, documentType } = event.detail;
    console.log('Preview document:', docId, 'Type:', documentType);
    // Open preview modal or navigate to preview page
  }

  function handleCustomAction(event:CustomEvent) {
    const { action, docId, documentType } = event.detail;
    console.log('Custom action:', action, 'Document:', docId, 'Type:', documentType);
    // Handle custom actions
  }

  function handleDataLoaded(event:CustomEvent) {
    const { documents, documentType } = event.detail;
    console.log('Data loaded for:', documentType, 'Count:', documents?.data?.length || 0);
    // Optional: Handle data loaded event
  }

  function handleError(event:CustomEvent) {
    const { error, documentType } = event.detail;
    console.error('Error loading documents for:', documentType, error);
    // Handle error (show toast, etc.)
  }

  function handleAddCertificate() {
    showAddCertificateModal = true;
  }

  async function handleAdminCertSubmit(event:CustomEvent) {
    isLoading = true;
    try {
      const { file, certificateData } = event.detail;

      console.log(event.detail,"handleAdminCertSubmit")

      // Call your API here to upload the document
      // await documentsApi.uploadCertificate({ file, certificateData, employeeId });
      // For now, just simulate:
      await new Promise(r => setTimeout(r, 1000));
      showAddCertificateModal = false;
      refreshKey += 1;
    } catch (e) {
      // handle error
    } finally {
      isLoading = false;
    }
  }

</script>

<DocumentViewer
employeeId={employeeId}
    accessType={access}
    enabledTabs={config.enabledTabs}
    showAddSkill={config.showAddSkill}
    rowActions={config.rowActions}
    showAddCertificate={config.showAddCertificate}
    {refreshKey}
    on:preview={handlePreview}
    on:customAction={handleCustomAction}
    on:dataLoaded={handleDataLoaded}
    on:error={handleError}
    on:addCertificate={handleAddCertificate}
  />

  {#if showAddCertificateModal}
  <Modal
  title="Add Certifcates"
  show={showAddCertificateModal}
  onClose={()=>showAddCertificateModal=false}
  wide={false}
  >   <AdminCertificateForm loading={isLoading}
        on:submit={handleAdminCertSubmit}
        on:cancel={() => showAddCertificateModal = false}
      />
</Modal>
{/if}