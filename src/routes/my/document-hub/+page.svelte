<script lang="ts">
  import { onMount } from 'svelte';
  import { documentsApi, type IDocumentQuery, type DocumentResponse } from '$lib/services/api/documents';
  import { auth } from '$lib/stores/auth';
  import { writable } from 'svelte/store';
  import DocumentHub from '$lib/components/documentCenter/DocumentHub.svelte';
  import IndexPageTemplate from '$lib/components/templates/IndexPageTemplate.svelte';

  // Access can be passed as a prop or derived from route
  export let access: 'own' | 'team' | 'global' = 'own';

  // State
  let filterValues = writable<IDocumentQuery>({});
  let documents = writable<DocumentResponse | null>(null);
  let loading = writable(false);

  // Fetch documents on filter change
  $: fetchDocuments();

  async function fetchDocuments() {
    loading.set(true);
    const query = { ...$filterValues, access };
    if (access === 'own') {
      query.employeeId = $auth.user?._id;
    }
    // Remove employee-based filters for 'own'
    if (access === 'own') {
      delete query.department;
      delete query.role;
      delete query.activeStatus;
      delete query.designation;
      delete query.location;
    }
    let result = await documentsApi.getDocuments(query)
    console.log(result,"fetchDocs")
    documents.set(result);
    loading.set(false);
  }
</script>

<IndexPageTemplate
title='Document Hub'>

<DocumentHub
  {access}
  {filterValues}
  {documents}
  {loading}
/>
</IndexPageTemplate>