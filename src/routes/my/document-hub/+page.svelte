<script lang="ts">
  import Filter from '$lib/components/common/Filter.svelte';
  import Button from '$lib/components/common/Button.svelte';
  import Toggle from '$lib/components/common/Toggle.svelte';
  import IndexPageTemplate from '$lib/components/templates/IndexPageTemplate.svelte';
  import { auth } from '$lib/stores/auth';
  import { getFinancialYears } from '$lib/utils/financialYear';
  import { writable } from 'svelte/store';

  // List of document types
  const items = [
    { label: 'Payslip', key: 'payslip', filtersEnabled: true },
    { label: 'Timesheet', key: 'timesheet', filtersEnabled: true },
    { label: 'Form16', key: 'form16', filtersEnabled: true },
    { label: 'Certificates', key: 'certificates', filtersEnabled: false },
    { label: 'Skills', key: 'skills', filtersEnabled: false },
  ];

  // For Toggle component
  const toggleItems = items.map(item => ({ id: item.key, label: item.label, disabled: false }));
  let selectedItemKey = items[0].key;
  $: selectedItem = items.find(item => item.key === selectedItemKey) ?? items[0];

  let filtersOpen = false;
  let filterValues = writable({});

  import type { filterSchema } from '$lib/types';

  // Month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(2000, i, 1).toLocaleString('default', { month: 'long' }),
    value: String(i + 1)
  }));

  // Access level (always Private, disabled)
  const accessLevelOption = [{ label: 'Private', value: 'Private', disabled: true }];

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

  function getDefaultDisabledFilterValues(filters: filterSchema[]): Record<string, any> {
    const defaults: Record<string, any> = {};
    for (const filter of filters) {
      if (filter.disabled && filter.type === 'select' && filter.options?.length) {
        defaults[filter.key] = filter.options[0].value;
      }
    }
    return defaults;
  }

  $: filtersSchema = (() => {
    const user = $auth?.user;

    let schema: filterSchema[] = [];

    switch (selectedItemKey) {
      case 'payslip':
        schema = [
          { key: 'type', label: 'Type', type: 'select', options: [{ label: 'Payslip', value: 'Payslip' }], disabled: true },
          { key: 'accessLevel', label: 'Access Level', type: 'select', options: accessLevelOption, disabled: true },
          { key: 'year', label: 'Year', type: 'select', options: getYearOptions(user?.joiningDate) },
          { key: 'month', label: 'Month', type: 'select', options: monthOptions },
        ];
        break;
      case 'timesheet':
        schema = [
          { key: 'type', label: 'Type', type: 'select', options: [{ label: 'Timesheet File', value: 'TimesheetFile' }], disabled: true },
          { key: 'accessLevel', label: 'Access Level', type: 'select', options: accessLevelOption, disabled: true },
          { key: 'year', label: 'Year', type: 'select', options: getYearOptions(user?.joiningDate) },
          { key: 'month', label: 'Month', type: 'select', options: monthOptions },
        ];
        break;
      case 'form16':
        schema = [
          { key: 'type', label: 'Type', type: 'select', options: [{ label: 'Form16', value: 'Form16' }], disabled: true },
          { key: 'accessLevel', label: 'Access Level', type: 'select', options: accessLevelOption, disabled: true },
          { key: 'financialYear', label: 'Financial Year', type: 'select', options: getFinancialYearOptions() },
        ];
        break;
      default:
        schema = [];
    }

    const disabledDefaults = getDefaultDisabledFilterValues(schema);
    filterValues.set(disabledDefaults);

    return schema;
  })();

  console.log(filtersSchema,"filterSchema")

  function handleToggleChange(key: string) {
    selectedItemKey = key;
    // Optionally reset filters or fetch data
  }

  function handleFilterApply(values: Record<string, any>) {
    filterValues.set(values);
    filtersOpen = false;
    // Fetch data with new filters
  }

  function handleFilterReset() {
    // FIXED: Preserve disabled field defaults while clearing editable ones
    const resetValues: Record<string, any> = {};
    
    for (const filter of filtersSchema) {
      if (filter.disabled && filter.type === 'select' && filter.options?.length) {
        // Keep disabled fields with their default values
        resetValues[filter.key] = String(filter.options[0].value);
      } else {
        // Clear editable fields
        resetValues[filter.key] = '';
      }
    }
    
    filterValues.set(resetValues);

    filtersOpen=false 
    setTimeout(() => {
      filtersOpen=true
    }, 10);
  }
  
     // Handle filter change
     function handleFilterChange(event: CustomEvent) {
      const { values } = event.detail;
      console.log(values,"handleFilterChange",event)
      filterValues.set(values);
    }

 
    

</script>

<IndexPageTemplate title="Document Hub" hasContainerShadow={false} >
  <div class="flex justify-end gap-4 mb-6">
    <Button on:click={() => filtersOpen = true} disabled={!selectedItem.filtersEnabled} variant="outline">
      Filters
    </Button>
  </div>

  <!-- Common Toggle Component for Document Types -->
  <Toggle items={toggleItems} bind:value={selectedItemKey} on:change={e => handleToggleChange(e.detail)} />

  <!-- Filters Panel -->
  <Filter
    filters={filtersSchema}
    values={$filterValues}
    isOpen={filtersOpen && selectedItem.filtersEnabled}
    on:change={handleFilterChange}
    on:apply={e => handleFilterApply(e.detail)}
    on:reset={handleFilterReset}
    on:close={() => filtersOpen = false}
  />

  <!-- Document List Placeholder -->
  <div class="bg-white rounded-lg shadow p-6 min-h-[200px] flex items-center justify-center text-gray-400 mt-6">
    <span>List of {selectedItem.label} will appear here.</span>
  </div>
</IndexPageTemplate>