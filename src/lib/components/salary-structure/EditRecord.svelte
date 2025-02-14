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
      <!-- General Information -->
      <div class="bg-gray-50 rounded-md p-4">
        <h3 class="text-base font-medium text-gray-900 mb-3">General Information</h3>
        <div class="bg-white p-3 rounded shadow-sm">
          <label for="name" class="block text-sm font-medium text-gray-600 mb-1">
            Configuration Name
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
    
      <!-- Fixed Earnings -->
      <div class="bg-gray-50 rounded-md p-4">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-base font-medium text-gray-900">Fixed Earnings</h3>
          {#if !isValidTotal && !readOnly}
            <span class="text-sm text-red-500">
              Total: {totalEarningsPercentage}% (Must be 100%)
            </span>
          {/if}
        </div>
        
        <div class="bg-white p-4 rounded shadow-sm">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {#each Object.entries(formData.fixedEarnings) as [key, value]}
              <div class="space-y-1">
                <label class="block text-sm font-medium text-gray-600">
                  {key.replace(/Percentage$/, '').split(/(?=[A-Z])/).join(' ')} (% of Gross)
                </label>
                <input 
                  type="number"
                  class="w-full h-9 border border-gray-200 rounded-md px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  bind:value={formData.fixedEarnings[key]}
                  disabled={readOnly || key === 'daPercentage'}
                  min="0"
                  max="100"
                />
                <p class="text-xs text-gray-500">
                  {#if key === 'basicPercentage'}
                    Typically 40% of Gross Salary
                  {:else if key === 'hraPercentage'}
                    Typically 20% of Gross Salary
                  {:else if key === 'daPercentage'}
                    Fixed 10% of Basic Salary
                  {:else}
                    Typically 40% of Gross Salary
                  {/if}
                </p>
              </div>
            {/each}
          </div>
        </div>
      </div>
    
      <!-- Statutory Deductions -->
      <div class="bg-gray-50 rounded-md p-4">
        <h3 class="text-base font-medium text-gray-900 mb-3">Statutory Deductions</h3>
        
        <!-- EPF Section -->
        <div class="bg-white p-4 rounded shadow-sm mb-4">
          <h4 class="text-sm font-medium text-gray-800 mb-3">Employee Provident Fund (EPF)</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-600">
                Employee Contribution (%)
              </label>
              <input 
                type="number"
                class="w-full h-9 border border-gray-200 rounded-md px-3 text-sm bg-gray-50"
                value={formData.statutoryDeductions.epf.employeeContribution}
                disabled={true}
              />
              <p class="text-xs text-gray-500">Fixed at 12% of (Basic + DA)</p>
            </div>
            
            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-600">
                Employer Contribution (%)
              </label>
              <input 
                type="number"
                class="w-full h-9 border border-gray-200 rounded-md px-3 text-sm bg-gray-50"
                value={formData.statutoryDeductions.epf.employerContribution}
                disabled={true}
              />
              <p class="text-xs text-gray-500">Fixed at 12% of (Basic + DA)</p>
            </div>
          </div>
        </div>
    
      <!-- ESI Section -->
      <div class="bg-white p-4 rounded shadow-sm mb-4">
          <h4 class="text-sm font-medium text-gray-800 mb-3">Employee State Insurance (ESI)</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-600">
                Employee Contribution (%)
              </label>
              <input 
                type="number"
                class="w-full h-9 border border-gray-200 rounded-md px-3 text-sm bg-gray-50"
                value={formData.statutoryDeductions.esi.employeeContribution}
                disabled={true}
              />
              <p class="text-xs text-gray-500">Fixed at 0.75% of Gross Salary</p>
            </div>
            
            <div class="space-y-1">
              <label class="block text-sm font-medium text-gray-600">
                Employer Contribution (%)
              </label>
              <input 
                type="number"
                class="w-full h-9 border border-gray-200 rounded-md px-3 text-sm bg-gray-50"
                value={formData.statutoryDeductions.esi.employerContribution}
                disabled={true}
              />
              <p class="text-xs text-gray-500">Fixed at 3.25% of Gross Salary</p>
            </div>
    
            <div class="space-y-1 md:col-span-2">
              <label class="block text-sm font-medium text-gray-600">
                Applicability Limit (₹)
              </label>
              <input 
                type="number"
                class="w-full h-9 border border-gray-200 rounded-md px-3 text-sm bg-gray-50"
                value={formData.statutoryDeductions.esi.applicabilityLimit}
                disabled={true}
              />
              <p class="text-xs text-gray-500">Fixed at ₹21,000 (ESI applicable if Gross Salary ≤ this amount)</p>
            </div>
          </div>
        </div>
        <!-- Professional Tax Section -->
        <div class="bg-white p-4 rounded shadow-sm">
          <div class="flex justify-between items-center mb-3">
            <h4 class="text-sm font-medium text-gray-800">Professional Tax</h4>
            {#if !readOnly}
              <button 
                type="button"
                class="text-sm bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600"
                on:click={addSlabRow}
              >
                Add Slab
              </button>
            {/if}
          </div>
    
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr class="bg-gray-50">
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">From (₹)</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">To (₹)</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500">Tax (₹)</th>
                  {#if !readOnly}
                    <th class="px-3 py-2 w-16"></th>
                  {/if}
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                {#each formData.statutoryDeductions.professionalTax.slabs as slab, index}
                  <tr>
                    <td class="px-2 py-1.5">
                      <input 
                        type="number"
                        class="w-full h-8 border border-gray-200 rounded px-2 text-sm"
                        bind:value={slab.fromAmount}
                        disabled={readOnly}
                      />
                    </td>
                    <td class="px-2 py-1.5">
                      <input 
                        type="number"
                        class="w-full h-8 border border-gray-200 rounded px-2 text-sm"
                        bind:value={slab.toAmount}
                        disabled={readOnly}
                      />
                    </td>
                    <td class="px-2 py-1.5">
                      <input 
                        type="number"
                        class="w-full h-8 border border-gray-200 rounded px-2 text-sm"
                        bind:value={slab.amount}
                        disabled={readOnly}
                      />
                    </td>
                    {#if !readOnly}
                      <td class="px-2 py-1.5">
                        <button
                          type="button"
                          class="text-xs text-red-600 hover:text-red-800"
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
        </div>
      </div>
    
      {#if !readOnly}
        <div class="flex justify-end pt-2">
          <button 
            type="submit" 
            class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            disabled={!isValidTotal}
          >
            Save Configuration
          </button>
        </div>
      {/if}
    </form> 