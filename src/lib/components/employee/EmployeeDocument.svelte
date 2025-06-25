<script lang="ts">
  import { getAccessConfig } from "$lib/utils/document";
  import DocumentViewer from "../documentCenter/DocumentViewer.svelte";


 export let access: 'own' | 'team' | 'global' = 'global';
export let employeeId;
  // Configuration based on access type
  $: config = getAccessConfig(access);

  let refreshKey = 0;


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

</script>

<DocumentViewer
employeeId={employeeId}
    accessType={access}
    enabledTabs={config.enabledTabs}
    showAddSkill={config.showAddSkill}
    rowActions={config.rowActions}
    {refreshKey}
    on:preview={handlePreview}
    on:customAction={handleCustomAction}
    on:dataLoaded={handleDataLoaded}
    on:error={handleError}
  />