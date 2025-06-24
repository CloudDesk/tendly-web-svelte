<script lang="ts">
  import Filter from '$lib/components/common/Filter.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import Toggle from '$lib/components/common/Toggle.svelte';
  import Table from "$lib/components/common/Table.svelte";
  import { auth } from '$lib/stores/auth';
  import { getFinancialYears } from '$lib/utils/financialYear';
  import type { filterSchema } from '$lib/types';
  import { onMount, createEventDispatcher } from 'svelte';
  import { documentsApi, type IDocument } from '$lib/services/api';

  type Column = {
    key: string;
    label: string;
    render?: (doc: IDocument) => string;
  };

  // Props
  export let accessType: 'own' | 'team' | 'global' = 'own';
  export let enabledTabs: string[] = ['payslip', 'timesheet', 'tax', 'certificates'];
  export let showAddSkill: boolean = false;
  export let rowActions: {
    preview?: boolean;
    download?: boolean;
    customActions?: Array<{
      label: string;
      action: string;
      condition?: (doc: IDocument) => boolean;
    }>;
  } = { preview: false, download: true };
  export let refreshKey = 0;

  $: if (refreshKey) {
    console.log("Refreshing documents...", refreshKey);
    fetchDocuments();
  }

  const dispatch = createEventDispatcher();

  console.log(enabledTabs,"enabledTabs")
  // All available document types
  const allItems = [
    { label: 'Payslip', key: 'payslip', filtersEnabled: true },
    { label: 'Timesheet', key: 'timesheet', filtersEnabled: true },
    { label: 'Tax', key: 'tax', filtersEnabled: true },
    { label: 'Certificates', key: 'certificates', filtersEnabled: false },
  ];

  // Filter items based on enabled tabs
  $: items = allItems.filter(item => enabledTabs.includes(item.key));
console.log(items, "items");

$: toggleItems = items.map(item => ({ id: item.key, label: item.label, disabled: false }));

$: selectedItemKey = items[0]?.key || 'payslip';
$: selectedItem = items.find(item => item.key === selectedItemKey) ?? items[0];

$: shouldShowAddSkill = showAddSkill &&
                        selectedItemKey === 'certificates' &&
                        accessType === 'own';

  // Local state variables
  let filtersOpen = false;
  let filterValues: Record<string, any> = {};
  let loading = false;
  let documents: any = null;
  let page = 1;
  let limit = 10;

  // Month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }),
    value: String(i + 1)
  }));

  // Get year options from joiningDate to current year
  function getYearOptions(joiningDate?: string) {
    if (!joiningDate) return [];
    const startYear = new Date(joiningDate).getFullYear();
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - startYear + 1 }, (_, i) => {
      const year = startYear + i;
      return { label: String(year), value: String(year) };
    });
  }

  // Get financial year options
  function getFinancialYearOptions() {
    return getFinancialYears(5).map(fy => ({ label: fy, value: fy }));
  }

  const typeCategoryMap: Record<string, { type: string; category: string }> = {
    payslip:    { type: 'Payslip',        category: 'Payroll' },
    timesheet:  { type: 'TimesheetFile',  category: 'Timesheet' },
    tax:        { type: 'Form16',         category: 'Tax' },
    certificates: { type: 'Certificate',  category: 'Certification' }
  };

  // Get base columns based on document type
  function getBaseColumns(docType: string): Column[] {
    const base: Column[] = [
      { key: "type", label: "Type" },
      { key: "category", label: "Category" },
    ];
    
    let specificColumns: Column[] = [];

    // Add type-specific columns
    switch (docType) {
      case 'certificates':
        specificColumns = [
            { 
                key: "certificateType", 
                label: "Certificate Type",
                render: (doc: IDocument) => doc.metadata?.certificate?.certificateType || "-"
            },
            { 
                key: "title", 
                label: "Title",
                render: (doc: IDocument) => doc.metadata?.certificate?.title || "-"
            },
            { 
                key: "verificationStatus", 
                label: "Verification Status",
                render: (doc: IDocument) => doc.metadata?.certificate?.verificationStatus || "Pending"
            },
        ];
        break;
      
      case 'payslip':
      case 'timesheet':
        specificColumns = [
          { key: "fileName", label: "File Name" },
          {
            key: "monthYear",
            label: "Year-Month",
            render: (doc: IDocument) => {
                if (docType === 'payslip' && doc.metadata?.payslip) {
                    const { month, year } = doc.metadata.payslip;
                    if (month && year) return `${year}-${month > 9 ? month : `0${month}`}`;
                }
                if (docType === 'timesheet' && doc.metadata?.timesheet) {
                    const { month, year } = doc.metadata.timesheet;
                    if (month && year) return `${year}-${month > 9 ? month : `0${month}`}`;
                }
                return "-";
            }
          }
        ];
        break;

      case 'tax':
        specificColumns = [
          { key: "fileName", label: "File Name" },
          {
            key: "financialYear",
            label: "Financial Year",
            render: (doc: IDocument) => doc.metadata?.form16?.financialYear || "-",
          }
        ];
        break;

      default:
        specificColumns = [
          { key: "fileName", label: "File Name" },
          {
            key: "uploadDate",
            label: "Upload Date",
            render: (doc: IDocument) => new Date(doc.uploadDate).toLocaleDateString(),
          }
        ];
    }

    return [...base, ...specificColumns];
  }

  // Get access-specific columns
  function getAccessColumns(): Column[] {
    const columns: Column[] = [];
    
    if (accessType === 'team' || accessType === 'global') {
      columns.push({ key: "username", label: "Employee" });
    }
    
    if (accessType === 'global') {
      columns.push({ key: "department", label: "Department" });
    }
    
    return columns;
  }

  // Get action columns
  function getActionColumns(): Column[] {
    const actionColumns: Column[] = [];

    // Status column
    actionColumns.push({
      key: "status",
      label: "Status",
      render: (doc: IDocument) => `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">${doc.status}</span>`,
    });

    // Actions column
    let actionsHtml = '';
    
    if (rowActions.download) {
      actionsHtml += `<a href="{filePath}" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-800 underline mr-2">Open</a>`;
    }
    
    if (rowActions.preview && selectedItemKey === 'payslip' && accessType === 'global') {
      actionsHtml += `<button class="text-green-600 hover:text-green-800 underline mr-2" onclick="handlePreview('{_id}')">Preview</button>`;
    }

    if (rowActions.customActions) {
      rowActions.customActions.forEach(action => {
        actionsHtml += `<button class="text-purple-600 hover:text-purple-800 underline mr-2" onclick="handleCustomAction('${action.action}', '{_id}')">${action.label}</button>`;
      });
    }

    actionColumns.push({
      key: "actions",
      label: "Actions",
      render: (doc: IDocument) => {
        let html = actionsHtml;
        html = html.replace(/\{filePath\}/g, doc.filePath || '#');
        html = html.replace(/\{_id\}/g, doc._id || '');
        
        if (!doc.filePath && rowActions.download) {
          html = html.replace(/<a[^>]*>Open<\/a>/, `<span class="text-gray-400">No file</span>`);
        }
        
        return html;
      },
    });

    return actionColumns;
  }

  // Dynamic columns based on access type and document type
  $: columns = [
    ...getBaseColumns(selectedItemKey),
    ...getAccessColumns(),
    ...getActionColumns()
  ];

  // Reactive filter schema based on selected item
  $: filtersSchema = (() => {
    const user = $auth?.user;
    let schema: filterSchema[] = [];

    switch (selectedItemKey) {
      case 'payslip':
        schema = [
          { key: 'type', label: 'Type', type: 'select', options: [{ label: 'Payslip', value: 'Payslip' }], disabled: true },
          { key: 'category', label: 'Category', type: 'select', options: [{ label: 'Payroll', value: 'Payroll' }], disabled: true },
          { key: 'year', label: 'Year', type: 'select', options: getYearOptions(user?.joiningDate) },
          { key: 'month', label: 'Month', type: 'select', options: monthOptions },
        ];
        break;
      case 'timesheet':
        schema = [
          { key: 'type', label: 'Type', type: 'select', options: [{ label: 'TimesheetFile', value: 'TimesheetFile' }], disabled: true },
          { key: 'category', label: 'Category', type: 'select', options: [{ label: 'Timesheet', value: 'Timesheet' }], disabled: true },
          { key: 'year', label: 'Year', type: 'select', options: getYearOptions(user?.joiningDate) },
          { key: 'month', label: 'Month', type: 'select', options: monthOptions },
        ];
        break;
      case 'tax':
        schema = [
          { key: 'type', label: 'Type', type: 'select', options: [{ label: 'Form16', value: 'Form16' }], disabled: true },
          { key: 'category', label: 'Category', type: 'select', options: [{ label: 'Tax', value: 'Tax' }], disabled: true },
          { key: 'financialYear', label: 'Financial Year', type: 'select', options: getFinancialYearOptions() },
        ];
        break;
      case 'certificates':
        schema = [
          { key: 'type', label: 'Type', type: 'select', options: [{ label: 'Certificate', value: 'Certificate' }], disabled: true },
          { key: 'category', label: 'Category', type: 'select', options: [{ label: 'Certification', value: 'Certification' }], disabled: true },
        ];
        break;
      default:
        schema = [];
    }

    // Add access-specific filters
    if (accessType === 'global') {
      schema.push(
        { key: 'department', label: 'Department', type: 'select', options: [] }, // Populate from API
        { key: 'role', label: 'Role', type: 'select', options: [] } // Populate from API
      );
    }

    return schema;
  })();

  // Handle toggle change
  async function handleToggleChange(key: string) {
    selectedItemKey = key;
    const mapping = typeCategoryMap[key] || { type: '', category: '' };
    filterValues = { type: mapping.type, category: mapping.category };
    await fetchDocuments();
  }

  // Handle filter apply
  function handleFilterApply(values: Record<string, any>) {
    filterValues = values;
    filtersOpen = false;
    fetchDocuments();
  }

  // Handle filter reset
  function handleFilterReset() {
    const resetValues: Record<string, any> = {};
    
    resetValues.type = filterValues.type;
    
    for (const filter of filtersSchema) {
      if (filter.disabled && filter.type === 'select' && filter.options?.length) {
        resetValues[filter.key] = String(filter.options[0].value);
      } else if (filter.key !== 'type') {
        resetValues[filter.key] = '';
      }
    }
    
    filterValues = resetValues;
    filtersOpen = false;
    setTimeout(() => {
      filtersOpen = true;
    }, 10);
  }
  
  // Handle filter change
  function handleFilterChange(event: CustomEvent) {
    const { values } = event.detail;
    filterValues = values;
  }

  // Handle Add Skill button click
  function handleAddSkill() {
    dispatch('addSkill', { documentType: selectedItemKey });
  }

  // Handle preview action
  function handlePreview(docId: string) {
    dispatch('preview', { docId, documentType: selectedItemKey });
  }

  // Handle custom actions
  function handleCustomAction(action: string, docId: string) {
    dispatch('customAction', { action, docId, documentType: selectedItemKey });
  }

  // Make functions available globally for HTML onclick handlers
  if (typeof window !== 'undefined') {
    (window as any).handlePreview = handlePreview;
    (window as any).handleCustomAction = handleCustomAction;
  }

  // Fetch documents based on current filters and selected document type
  const fetchDocuments = async () => {
    loading = true;
    try {
      const query: Record<string, any> = { 
        ...filterValues, 
        access: accessType,
        page,
        limit
      };

      // Add employee ID for own access
      if (accessType === 'own') {
        query.employeeId = $auth.user?._id;
      }

      // Remove employee-based filters for 'own' access
      if (accessType === 'own') {
        delete query.department;
        delete query.role;
        delete query.activeStatus;
        delete query.designation;
        delete query.location;
      }

      const result = await documentsApi.getDocuments(query);
      documents = result;
      
      // Dispatch data loaded event
      dispatch('dataLoaded', { documents: result, documentType: selectedItemKey });
    } catch (error) {
      console.log(error);
      dispatch('error', { error, documentType: selectedItemKey });
    } finally {
      loading = false;
    }
  };

  // Handle page change event
  async function handlePage(event: CustomEvent) {
    loading = true;
    try {
      const { page: newPage } = event.detail;
      page = newPage || 1;
      await fetchDocuments();
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (items.length > 0) {
      const mapping = typeCategoryMap[selectedItemKey] || { type: '', category: '' };
      filterValues = { type: mapping.type, category: mapping.category };
      page = 1;
      limit = 10;
      fetchDocuments();
    }
  });
</script>

<div class="document-viewer">
  <!-- Header with buttons -->
  <div class="flex justify-end gap-4 mb-6">
    {#if shouldShowAddSkill}
      <Button on:click={handleAddSkill} variant="primary">
        Add Skill
      </Button>
    {/if}
    {#if selectedItem?.filtersEnabled}
    <Button 
      on:click={() => filtersOpen = true} 
      disabled={!selectedItem?.filtersEnabled} 
      variant="outline"
    >
      Filters
    </Button>
    {/if}
  </div>

  <!-- Document Type Toggle -->
  {#if items.length > 0}
    <Toggle 
      items={toggleItems} 
      bind:value={selectedItemKey} 
      on:change={e => handleToggleChange(e.detail)} 
    />
  {/if}

  <!-- Filters Panel -->
  <Filter
    filters={filtersSchema}
    values={filterValues}
    isOpen={filtersOpen && selectedItem?.filtersEnabled}
    on:change={handleFilterChange}
    on:apply={e => handleFilterApply(e.detail)}
    on:reset={handleFilterReset}
    on:close={() => filtersOpen = false}
  />

  <!-- Document List -->
  <div class="bg-white rounded-lg shadow p-6 min-h-[200px] mt-6">
    {#if loading}
      <div class="flex items-center justify-center h-32">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">Loading documents...</span>
      </div>
    {:else if documents?.data && documents.data.length > 0}
      <Table
        {columns}
        data={documents?.data ?? []}
        meta={documents?.meta}
        {loading}
        serverSide={true}
        on:page={handlePage}
        searchable={false}
      />
    {:else}
      <div class="flex items-center justify-center h-32 text-gray-400">
        <div class="text-center">
          <div class="text-lg font-medium mb-2">No documents found</div>
          <div class="text-sm">Try adjusting your filters or selecting a different document type.</div>
        </div>
      </div>
    {/if}
  </div>
</div>



<!-- 
// Example 1: Own Documents Page (routes/my/document-hub/+page.svelte)
<script lang="ts">
  import IndexPageTemplate from '$lib/components/templates/IndexPageTemplate.svelte';
  import DocumentViewer from '$lib/components/common/DocumentViewer.svelte';

  function handleAddSkill(event) {
    const { documentType } = event.detail;
    // Navigate to add skill page
    goto('/my/skills/add');
  }
</script>

<IndexPageTemplate title="My Documents" hasContainerShadow={false}>
  <DocumentViewer
    accessType="own"
    enabledTabs={['payslip', 'timesheet', 'tax', 'certificates']}
    showAddSkill={true}
    rowActions={{ preview: false, download: true }}
    on:addSkill={handleAddSkill}
  />
</IndexPageTemplate>

// ================================================================

// Example 2: Team Documents Page (routes/team/documents/+page.svelte)
<script lang="ts">
  import IndexPageTemplate from '$lib/components/templates/IndexPageTemplate.svelte';
  import DocumentViewer from '$lib/components/common/DocumentViewer.svelte';

  function handleDataLoaded(event) {
    const { documents, documentType } = event.detail;
    console.log(`Loaded ${documents?.data?.length || 0} ${documentType} documents for team`);
  }
</script>

<IndexPageTemplate title="Team Documents" hasContainerShadow={false}>
  <DocumentViewer
    accessType="team"
    enabledTabs={['timesheet', 'certificates']}
    showAddSkill={false}
    rowActions={{ preview: false, download: true }}
    on:dataLoaded={handleDataLoaded}
  />
</IndexPageTemplate>

// ================================================================

// Example 3: Global/Admin Documents Page (routes/admin/documents/+page.svelte)
<script lang="ts">
  import IndexPageTemplate from '$lib/components/templates/IndexPageTemplate.svelte';
  import DocumentViewer from '$lib/components/common/DocumentViewer.svelte';
  import PreviewModal from '$lib/components/modals/PreviewModal.svelte';

  let showPreviewModal = false;
  let previewDocId = '';

  function handlePreview(event) {
    const { docId, documentType } = event.detail;
    if (documentType === 'payslip') {
      previewDocId = docId;
      showPreviewModal = true;
    }
  }

  function handleCustomAction(event) {
    const { action, docId, documentType } = event.detail;
    switch (action) {
      case 'audit':
        // Handle audit action
        break;
      case 'approve':
        // Handle approve action
        break;
    }
  }
</script>

<IndexPageTemplate title="All Documents" hasContainerShadow={false}>
  <DocumentViewer
    accessType="global"
    enabledTabs={['payslip', 'timesheet', 'tax', 'certificates']}
    showAddSkill={false}
    rowActions={{
      preview: true,
      download: true,
      customActions: [
        { label: 'Audit', action: 'audit' },
        { label: 'Approve', action: 'approve' }
      ]
    }}
    on:preview={handlePreview}
    on:customAction={handleCustomAction}
  />
</IndexPageTemplate>

{#if showPreviewModal}
  <PreviewModal
    docId={previewDocId}
    on:close={() => showPreviewModal = false}
  />
{/if}

// ================================================================

// Example 4: Custom Configuration
<script lang="ts">
  import DocumentViewer from '$lib/components/common/DocumentViewer.svelte';
  
  // Custom configuration for specific use case
  const customConfig = {
    enabledTabs: ['certificates'], // Only certificates
    showAddSkill: true,
    rowActions: {
      preview: false,
      download: true,
      customActions: [
        { label: 'Verify', action: 'verify' },
        { label: 'Export', action: 'export' }
      ]
    }
  };
</script>

<DocumentViewer
  accessType="own"
  enabledTabs={customConfig.enabledTabs}
  showAddSkill={customConfig.showAddSkill}
  rowActions={customConfig.rowActions}
  on:customAction={handleVerifyOrExport}
/>

// ================================================================

// Key Features Summary:

// 1. ✅ Reusable Component
//    - Single DocumentViewer component handles all use cases
//    - Props-based configuration for different behaviors

// 2. ✅ Add Skill Button Visibility
//    - Only shows when: accessType="own" AND selectedTab="certificates" AND showAddSkill=true
//    - Hidden for team and global access

// 3. ✅ Dynamic Columns Based on Access
//    - own: base columns only
//    - team: base columns + username
//    - global: base columns + username + department

// 4. ✅ Dynamic Tab Visibility
//    - global: all tabs (payslip, timesheet, tax, certificates) + preview for payslip
//    - team: timesheet, certificates only
//    - own: all tabs available

// 5. ✅ Row Actions Configuration
//    - Configurable preview, download, and custom actions
//    - Preview only enabled for payslip in global access
//    - Custom actions can be added per use case

// 6. ✅ Event-Driven Architecture
//    - Components communicate via events
//    - Parent pages handle business logic
//    - Clean separation of concerns
-->