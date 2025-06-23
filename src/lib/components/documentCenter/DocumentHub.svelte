<script lang="ts">
    import Filter from '$lib/components/common/Filter.svelte';
    import Table from '$lib/components/common/Table.svelte';
    import Toggle from '$lib/components/common/Toggle.svelte';
    import type { filterSchema } from '$lib/types';

  
    export let access: 'own' | 'team' | 'global';
    export let filterValues: import('svelte/store').Writable<Record<string, any>>;
    export let documents;
    export let loading;
  
    // Example options (replace with your real logic)
    const yearOptions = [
      { label: '2024', value: '2024' },
      { label: '2023', value: '2023' }
    ];
    const monthOptions = [
      { label: 'January', value: '1' },
      { label: 'February', value: '2' }
      // ...etc
    ];
    const financialYearOptions = [
      { label: '2023-2024', value: '2023-2024' },
      { label: '2022-2023', value: '2022-2023' }
    ];
    const departmentOptions = [
      { label: 'HR', value: 'hr' },
      { label: 'Engineering', value: 'engineering' }
    ];
    const roleOptions = [
      { label: 'Admin', value: 'admin' },
      { label: 'Manager', value: 'manager' }
    ];
  
    // Document type toggle items
    const typeToggleItems = [
      { id: 'Payslip', label: 'Payslip' },
      { id: 'TimesheetFile', label: 'Timesheet File' },
      { id: 'Form16', label: 'Form16' },
      { id: 'OfferLetter', label: 'OfferLetter' },
      { id: 'HikeLetter', label: 'HikeLetter' }
    ];
    let selectedType: string = typeToggleItems[0].id;

    // When toggle changes, update filterValues store for 'type'
    function handleTypeToggle(type: string) {
      selectedType = type;
      filterValues.update((values: Record<string, any>) => ({ ...values, type }));
    }

    // Build filter schema based on access and selectedType
    $: filtersSchema = [
      { key: 'type', label: 'Type', type: 'select', options: [ { label: selectedType.replace(/([A-Z])/g, ' $1').trim(), value: selectedType } ], disabled: true },
      { key: 'year', label: 'Year', type: 'select', options: yearOptions },
      { key: 'month', label: 'Month', type: 'select', options: monthOptions },
      { key: 'financialYear', label: 'Financial Year', type: 'select', options: financialYearOptions },
      ...(access !== 'own' ? [
        { key: 'department', label: 'Department', type: 'select', options: departmentOptions },
        { key: 'role', label: 'Role', type: 'select', options: roleOptions }
      ] : [])
    ] as filterSchema[];

    // Ensure filterValues.type is always set to selectedType
    $: filterValues.update((values: Record<string, any>) => ({ ...values, type: selectedType }));
  
    // Table columns
    const columns = [
      { key: 'type', label: 'Type' },
      { key: 'category', label: 'Category' },
      { key: 'fileName', label: 'File Name' },
      { key: 'uploadDate', label: 'Upload Date' },
      { key: 'status', label: 'Status' },
      {
        key: 'filePath',
        label: 'File',
        render: (row: any) => `<a href="${row.filePath}" target="_blank" rel="noopener">Open</a>`
      }
    ];
  </script>
  



  <Toggle items={typeToggleItems} bind:value={selectedType} on:change={e => handleTypeToggle(e.detail)} />

  <Filter
    filters={filtersSchema}
    values={$filterValues}
    on:apply={e => filterValues.set(e.detail)}
  />
  
  <Table
    {columns}
    data={$documents?.data ?? []}
    loading={$loading}
  /> 