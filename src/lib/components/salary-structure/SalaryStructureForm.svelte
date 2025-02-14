<script>
    import { taxstates,professionalTaxs } from '$lib/constants/users';
      import { createEventDispatcher } from 'svelte';
      
      export let initialData = null;
      export let readOnly = false;
      
      const dispatch = createEventDispatcher();
      
      // Initialize form data with all values set to 0 by default
      let formData = {
        name: initialData?.name || '',
        fixedEarnings: {
          basicPercentage: initialData?.fixedEarnings?.basicPercentage || 0,
          hraPercentage: initialData?.fixedEarnings?.hraPercentage || 0,
          daPercentage: initialData?.fixedEarnings?.daPercentage || 0,
          otherAllowancePercentage: initialData?.fixedEarnings?.otherAllowancePercentage || 0,
        },
        statutoryDeductions: {
          epf: {
            employeeContribution: initialData?.statutoryDeductions?.epf?.employeeContribution || 12,
            employerContribution: initialData?.statutoryDeductions?.epf?.employerContribution || 12,
            maxLimit: initialData?.statutoryDeductions?.epf?.maxLimit || 15000,
          },
          esi: {
            employeeContribution: initialData?.statutoryDeductions?.esi?.employeeContribution || 0.75,
            employerContribution: initialData?.statutoryDeductions?.esi?.employerContribution || 3.25,
            applicabilityLimit: initialData?.statutoryDeductions?.esi?.applicabilityLimit || 21000,
          },
          professionalTax: {
            state: initialData?.statutoryDeductions?.professionalTax?.state || 'Tamil Nadu',
            slabs: initialData?.statutoryDeductions?.professionalTax?.slabs || [
              { fromAmount: 3500, toAmount: 7500, amount: 0 },
              { fromAmount: 7501, toAmount: 12500, amount: 171 },
              { fromAmount: 12501, toAmount: 20000, amount: 208 },
              { fromAmount: 20001, toAmount: 25000, amount: 317 },
              { fromAmount: 25001, toAmount: 30000, amount: 442 },
              { fromAmount: 30001, toAmount: null, amount: 597 },
            ]
          }
        }
      };
      
      function handleSubmit() {
        if (!readOnly) {
          dispatch('submit', formData);
        }
      }
      
      function addSlabRow() {
        const lastSlab = formData.statutoryDeductions.professionalTax.slabs[
          formData.statutoryDeductions.professionalTax.slabs.length - 1
        ];
        
        const newFromAmount = lastSlab.toAmount ? lastSlab.toAmount + 1 : 0;
        
        formData.statutoryDeductions.professionalTax.slabs = [
          ...formData.statutoryDeductions.professionalTax.slabs,
          { fromAmount: newFromAmount, toAmount: null, amount: 0 }
        ];
      }
      
      function handleFromAmountChange(index, value) {
        const previousSlab = formData.statutoryDeductions.professionalTax.slabs[index - 1];
        if (previousSlab && !previousSlab.toAmount) {
          previousSlab.toAmount = value - 1;
        }
      }
      
      function removeSlabRow(index) {
        formData.statutoryDeductions.professionalTax.slabs = formData.statutoryDeductions.professionalTax.slabs
          .filter((_, i) => i !== index);
      }
  
      // Validation logic for fixed earnings total
      $: totalEarningsPercentage = formData.fixedEarnings.basicPercentage + 
                                  formData.fixedEarnings.hraPercentage + 
                                  formData.fixedEarnings.otherAllowancePercentage ;
                                  // formData.fixedEarnings.daPercentage
                                  ;
      $: isValidTotal = totalEarningsPercentage === 100;
  
      // Calculate DA as 10% of Basic Salary
      // $: formData.fixedEarnings.daPercentage = formData.fixedEarnings.basicPercentage * 0.10;
  </script>
  
  <form on:submit|preventDefault={handleSubmit} class="space-y-4">
      <!-- Name Configuration -->
      <div class="bg-white rounded-md shadow-sm">
          <h3 class="text-base font-medium text-gray-900 mb-3">General Information</h3>
          <div class="bg-white p-3 rounded shadow-sm">
              <label for="name" class="block text-sm font-medium text-gray-600 mb-1">
                  Name
                </label>
                <input 
                  type="text" 
                  id="name" 
                  class="w-full h-9 border border-gray-200 rounded-md px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  bind:value={formData.name} 
                  disabled={readOnly}
                  required
                />
          </div>
      </div>
      
      <!-- Fixed Earnings Configuration -->
      <div class="bg-white rounded-md shadow-sm">
          <div class="border-b px-4 py-3">
              <h3 class="text-lg font-medium">Fixed Earnings</h3>
              {#if !isValidTotal && !readOnly}
                  <p class="text-red-500 text-sm mt-1">
                      Total percentage must equal 100% (current: {totalEarningsPercentage}%)
                  </p>
              {/if}
          </div>
          <div class="p-4">
              <div class="grid grid-cols-2 gap-4">
                  <div>
                      <label for="basicPercentage" class="block text-sm font-medium text-gray-700 mb-1">
                          Basic Salary (% of Gross)
                      </label>
                      <input 
                          type="number" 
                          id="basicPercentage" 
                          min="0" 
                          max="100" 
                          class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          bind:value={formData.fixedEarnings.basicPercentage} 
                          disabled={readOnly}
                      />
                      <p class="text-sm text-gray-500 mt-1">Typically 40% of Gross Salary</p>
                  </div>
                  
                  <div>
                      <label for="hraPercentage" class="block text-sm font-medium text-gray-700 mb-1">
                          House Rent Allowance (% of Gross)
                      </label>
                      <input 
                          type="number" 
                          id="hraPercentage" 
                          min="0" 
                          max="100" 
                          class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          bind:value={formData.fixedEarnings.hraPercentage} 
                          disabled={readOnly}
                      />
                      <p class="text-sm text-gray-500 mt-1">Typically 20% of Gross Salary</p>
                  </div>
                  
                  <div>
                      <label for="daPercentage" class="block text-sm font-medium text-gray-700 mb-1">
                          Dearness Allowance (% of Basic)
                      </label>
                      <input 
                          type="number" 
                          id="daPercentage" 
                          min="0" 
                          max="100" 
                          class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          bind:value={formData.fixedEarnings.daPercentage} 
                          disabled={readOnly}
                      />
                      <p class="text-sm text-gray-500 mt-1">Fixed 10% of Basic Salary</p>
                  </div>
                  
                  <div>
                      <label for="otherAllowancePercentage" class="block text-sm font-medium text-gray-700 mb-1">
                          Other Allowance (% of Gross)
                      </label>
                      <input 
                          type="number" 
                          id="otherAllowancePercentage" 
                          min="0" 
                          max="100" 
                          class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          bind:value={formData.fixedEarnings.otherAllowancePercentage} 
                          disabled={readOnly}
                      />
                      <p class="text-sm text-gray-500 mt-1">Typically 40% of Gross Salary</p>
                  </div>
              </div>
          </div>
      </div>
      
      <!-- EPF Configuration -->
      <div class="bg-white rounded-md shadow-sm">
          <div class="border-b px-4 py-3">
              <h3 class="text-lg font-medium">Employee Provident Fund (EPF)</h3>
          </div>
          <div class="p-4">
              <div class="grid grid-cols-2 gap-4">
                  <div>
                      <label for="epfEmployeeContribution" class="block text-sm font-medium text-gray-700 mb-1">
                          Employee Contribution (% of Basic + DA)
                      </label>
                      <input 
                          type="number" 
                          id="epfEmployeeContribution" 
                          min="0" 
                          max="100" 
                          step="0.01"
                          class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          bind:value={formData.statutoryDeductions.epf.employeeContribution} 
                          disabled={true}
                      />
                      <p class="text-sm text-gray-500 mt-1">Fixed at 12% of (Basic + DA)</p>
                  </div>
                  
                  <div>
                      <label for="epfEmployerContribution" class="block text-sm font-medium text-gray-700 mb-1">
                          Employer Contribution (% of Basic + DA)
                      </label>
                      <input 
                          type="number" 
                          id="epfEmployerContribution" 
                          min="0" 
                          max="100" 
                          step="0.01"
                          class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          bind:value={formData.statutoryDeductions.epf.employerContribution} 
                          disabled={true}
                      />
                      <p class="text-sm text-gray-500 mt-1">Fixed at 12% of (Basic + DA)</p>
                  </div>
                  
                  <div class="col-span-2">
                      <label for="epfMaxLimit" class="block text-sm font-medium text-gray-700 mb-1">
                          Max Basic Salary Limit for EPF (₹)
                      </label>
                      <input 
                          type="number" 
                          id="epfMaxLimit" 
                          min="0" 
                          class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          bind:value={formData.statutoryDeductions.epf.maxLimit} 
                          disabled={true}
                      />
                      <p class="text-sm text-gray-500 mt-1">
                          Fixed at ₹15,000 (PF amount must not exceed ₹1,800)
                      </p>
                  </div>
              </div>
          </div>
      </div>
      
      <!-- ESI Configuration -->
      <div class="bg-white rounded-md shadow-sm">
          <div class="border-b px-4 py-3">
              <h3 class="text-lg font-medium">Employee State Insurance (ESI)</h3>
          </div>
          <div class="p-4">
              <div class="grid grid-cols-2 gap-4">
                  <div>
                      <label for="esiEmployeeContribution" class="block text-sm font-medium text-gray-700 mb-1">
                          Employee Contribution (% of Gross)
                      </label>
                      <input 
                          type="number" 
                          id="esiEmployeeContribution" 
                          min="0" 
                          max="100" 
                          step="0.01"
                          class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          bind:value={formData.statutoryDeductions.esi.employeeContribution} 
                          disabled={true}
                      />
                      <p class="text-sm text-gray-500 mt-1">Fixed at 0.75% of Gross Salary</p>
                  </div>
                  
                  <div>
                      <label for="esiEmployerContribution" class="block text-sm font-medium text-gray-700 mb-1">
                          Employer Contribution (% of Gross)
                      </label>
                      <input 
                          type="number" 
                          id="esiEmployerContribution" 
                          min="0" 
                          max="100" 
                          step="0.01"
                          class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          bind:value={formData.statutoryDeductions.esi.employerContribution} 
                          disabled={true}
                      />
                      <p class="text-sm text-gray-500 mt-1">Fixed at 3.25% of Gross Salary</p>
                  </div>
                  
                  <div class="col-span-2">
                      <label for="esiApplicabilityLimit" class="block text-sm font-medium text-gray-700 mb-1">
                          Applicability Limit (₹)
                      </label>
                      <input 
                          type="number" 
                          id="esiApplicabilityLimit" 
                          min="0" 
                          class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          bind:value={formData.statutoryDeductions.esi.applicabilityLimit} 
                          disabled={true}
                      />
                      <p class="text-sm text-gray-500 mt-1">
                          Fixed at ₹21,000 (ESI applicable if Gross Salary ≤ this amount)
                      </p>
                  </div>
              </div>
          </div>
      </div>
      
     <!-- Professional Tax Configuration -->
   
  
    <div class="bg-white rounded-md shadow-sm">
      <div class="border-b px-4 py-3">
          <h3 class="text-lg font-medium">Professional Tax</h3>
          <p class="text-sm text-gray-500">Deducted twice a year (January & July) based on 6 months accumulated salary</p>
      </div>
      <div class="p-4 space-y-4">
          <div>
              <label for="ptState" class="block text-sm font-medium text-gray-700 mb-1">
                  State
              </label>
              <input 
                  type="text" 
                  id="ptState" 
                  class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  bind:value={formData.statutoryDeductions.professionalTax.state} 
                  disabled={readOnly}
              />
          </div>
          
          <div class="mt-4">
              <div class="flex justify-between items-center mb-2">
                  <h4 class="text-md font-medium">Tax Slabs</h4>
                  {#if !readOnly}
                      <button 
                          type="button"
                          class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          on:click={addSlabRow}
                      >
                          Add Slab
                      </button>
                  {/if}
              </div>
              
              <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50">
                          <tr>
                              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From Amount (₹)</th>
                              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To Amount (₹)</th>
                              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax Amount (₹)</th>
                              {#if !readOnly}
                                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Action</th>
                              {/if}
                          </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                          {#each formData.statutoryDeductions.professionalTax.slabs as slab, index}
                              <tr>
                                  <td class="px-4 py-2">
                                      <input 
                                          type="number" 
                                          min="0" 
                                          class="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          bind:value={slab.fromAmount}
                                          on:change={(e) => handleFromAmountChange(index, e.target.value)} 
                                          disabled={readOnly}
                                      />
                                  </td>
                                  <td class="px-4 py-2">
                                      <input 
                                          type="number" 
                                          min="0" 
                                          placeholder="Optional"
                                          class="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          bind:value={slab.toAmount} 
                                          disabled={readOnly}
                                      />
                                  </td>
                                  <td class="px-4 py-2">
                                      <input 
                                          type="number" 
                                          min="0" 
                                          class="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          bind:value={slab.amount} 
                                          disabled={readOnly}
                                      />
                                  </td>
                                  {#if !readOnly}
                                      <td class="px-4 py-2">
                                          <button 
                                              type="button"
                                              class="text-red-600 hover:text-red-900 text-sm"
                                              on:click={() => removeSlabRow(index)}
                                              disabled={formData.statutoryDeductions.professionalTax.slabs.length <= 1}
                                          >
                                              Remove
                                          </button>
                                      </td>
                                  {/if}
                              </tr>
                          {/each}
                      </tbody>
                  </table>
              </div>
              {#if !readOnly}
                  <p class="text-sm text-gray-500 mt-2">
                      Note: 'To Amount' is optional for the last slab. When adding a new slab, 'From Amount' will automatically be set to the previous slab's 'To Amount' + 1.
                  </p>
              {/if}
          </div>
      </div>
  </div>
  
  {#if !readOnly}
      <div class="flex justify-end">
          <button 
              type="submit" 
              class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              disabled={!isValidTotal}
          >
              Save Configuration
          </button>
      </div>
  {/if}
  
  </form> 
  