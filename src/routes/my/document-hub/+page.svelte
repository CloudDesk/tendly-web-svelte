<script lang="ts">
  import IndexPageTemplate from '$lib/components/templates/IndexPageTemplate.svelte';
  import DocumentViewer from '$lib/components/documentCenter/DocumentViewer.svelte';
  import { getAccessConfig } from '$lib/utils/document';

  // Props to control the component behavior
  export let access: 'own' | 'team' | 'global' = 'own';

  // Configuration based on access type
  $: config = getAccessConfig(access);


  // Event handlers
  function handleAddSkill(event:CustomEvent) {
    const { documentType } = event.detail;
    console.log('Add skill clicked for:', documentType);

    
  }

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

<IndexPageTemplate title="Document Hub" hasContainerShadow={false}>
  <DocumentViewer
    accessType={access}
    enabledTabs={config.enabledTabs}
    showAddSkill={config.showAddSkill}
    rowActions={config.rowActions}
    on:addSkill={handleAddSkill}
    on:preview={handlePreview}
    on:customAction={handleCustomAction}
    on:dataLoaded={handleDataLoaded}
    on:error={handleError}
  />
</IndexPageTemplate>


<!-- <script lang="ts">
  import Filter from '$lib/components/common/Filter.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import Toggle from '$lib/components/common/Toggle.svelte';
  import IndexPageTemplate from '$lib/components/templates/IndexPageTemplate.svelte';
  import { auth } from '$lib/stores/auth';
  import { getFinancialYears } from '$lib/utils/financialYear';
  import type { filterSchema } from '$lib/types';
  import { onMount } from 'svelte';
  import { documentsApi, type IDocument } from '$lib/services/api';
  import Table from "$lib/components/common/Table.svelte";
  export let access: 'own' | 'team' | 'global' = 'own';

  // List of document types
  const items = [
    { label: 'Payslip', key: 'payslip', filtersEnabled: true },
    { label: 'Timesheet', key: 'timesheet', filtersEnabled: true },
    { label: 'Tax', key: 'tax', filtersEnabled: true },
    { label: 'Certificates', key: 'certificates', filtersEnabled: false },
  ];

  // For Toggle component
  const toggleItems = items.map(item => ({ id: item.key, label: item.label, disabled: false }));
  let selectedItemKey = items[0].key;
  $: selectedItem = items.find(item => item.key === selectedItemKey) ?? items[0];

  // Local state variables (no stores)
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
          // Add certificate-specific filters here if needed
        ];
        break;
      default:
        schema = [];
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
    fetchDocuments(); // Fetch data with new filters
  }

  // Handle filter reset
  function handleFilterReset() {
    const resetValues: Record<string, any> = {};
    
    // Preserve the current document type
    resetValues.type = filterValues.type;
    
    for (const filter of filtersSchema) {
      if (filter.disabled && filter.type === 'select' && filter.options?.length) {
        // Keep disabled fields with their default values
        resetValues[filter.key] = String(filter.options[0].value);
      } else if (filter.key !== 'type') {
        // Clear editable fields (except type)
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
    console.log(values, "handleFilterChange", event);
    filterValues = values;
  }

  // Fetch documents based on current filters and selected document type
  const fetchDocuments = async () => {
    loading = true;
    try {
      // Build query based on selected document type and current filters
      const query: Record<string, any> = { 
        ...filterValues, 
        access,
        page,
        limit
      };

      // Add employee ID for own access
      if (access === 'own') {
        query.employeeId = $auth.user?._id;
      }

      // Remove employee-based filters for 'own' access
      if (access === 'own') {
        delete query.department;
        delete query.role;
        delete query.activeStatus;
        delete query.designation;
        delete query.location;
      }

      console.log(query, "query");
      const result = await documentsApi.getDocuments(query);
      console.log(result, "fetchDocs");
      documents = result;
    } catch (error) {
      console.log(error);
    } finally {
      loading = false;
    }
  };

  onMount(() => {
    const mapping = typeCategoryMap[selectedItemKey] || { type: '', category: '' };
    filterValues = { type: mapping.type, category: mapping.category };
    page = 1;
    limit = 10;
    fetchDocuments();
  });

  $: columns = [
    { key: "type", label: "Type" },
    { key: "category", label: "Category" },
    { key: "fileName", label: "File Name" },
    ...(selectedItemKey === "payslip"
      ? [
          {
            key: "monthYear",
            label: "Year-Month",
            render: (doc:IDocument) =>{
            //  doc.metadata?.payslip?.monthYear || "-",
          const m = doc.metadata?.payslip?.month;
          const y = doc.metadata?.payslip?.year;
          if (m && y) {
            const monthName = m>9?m:`0${m}`
            return `${y}-${monthName}`;
          }
          return "-";
        }
          },
        ]
      : selectedItemKey === "timesheet"
      ? [
      {
        key: "monthYear",
        label: "Year-Month",
        render: (doc: IDocument) => {
          const m = doc.metadata?.timesheet?.month;
          const y = doc.metadata?.timesheet?.year;
          if (m && y) {
            const monthName = m>9?m:`0${m}`
            return `${y}-${monthName}`;
          }
          return "-";
        }
      }
    ]
      : selectedItemKey === "tax"
      ? [
          {
            key: "financialYear",
            label: "Financial Year",
            render: (doc:IDocument) => doc.metadata?.form16?.financialYear || "-",
          },
        ]
      : [
          {
            key: "uploadDate",
            label: "Upload Date",
            render: (doc:IDocument) => new Date(doc.uploadDate).toLocaleDateString(),
          },
        ]),
    {
      key: "status",
      label: "Status",
      render: (doc) => `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">${doc.status}</span>`,
    },
    {
      key: "filePath",
      label: "File",
      render: (doc:IDocument) =>
        doc.filePath
          ? `<a href="${doc.filePath}" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-800 underline">Open</a>`
          : `<span class="text-gray-400">No file</span>`,
    },
  ];

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


</script>

<IndexPageTemplate title="Document Hub" hasContainerShadow={false} >
  <div class="flex justify-end gap-4 mb-6">
    <Button on:click={() => filtersOpen = true} disabled={!selectedItem.filtersEnabled} variant="outline">
      Filters
    </Button>
  </div>

// Common Toggle Component for Document Types
  <Toggle items={toggleItems} bind:value={selectedItemKey} on:change={e => handleToggleChange(e.detail)} />

  // Filters Panel 
  <Filter
    filters={filtersSchema}
    values={filterValues}
    isOpen={filtersOpen && selectedItem.filtersEnabled}
    on:change={handleFilterChange}
    on:apply={e => handleFilterApply(e.detail)}
    on:reset={handleFilterReset}
    on:close={() => filtersOpen = false}
  />

  // Document List
  <div class="bg-white rounded-lg shadow p-6 min-h-[200px] mt-6">
    {#if loading}
      <div class="flex items-center justify-center h-32">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-2 text-gray-600">Loading documents...</span>
      </div>
    {:else if documents?.data && documents.data.length > 0}
      <Table
      columns={columns}
        data={documents?.data ?? []}
        meta={documents?.meta}
        loading={loading}
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
</IndexPageTemplate> -->