<script lang="ts">
  import { ReceiptIndianRupee } from "lucide-svelte";
  import Card from "../common/Card.svelte";
  import { formatCurrency } from "$lib/utils/currency";
  import type { TaxDeclaration } from "$lib/types";

  export let taxDeclaration: TaxDeclaration;
  console.log(taxDeclaration, "taxDeclaration");

  const getDisplayToAmount = (
    slabToAmount: number | null,
    taxableIncome: number
  ): number => {
    if (slabToAmount === null || slabToAmount > taxableIncome) {
      return taxableIncome;
    }
    return slabToAmount;
  };

  const capitalize = (s: string) =>
    (s && String(s[0]).toUpperCase() + String(s).slice(1)) || "";
</script>

<Card
  title={`${capitalize(taxDeclaration.regime)} Regime Taxable Income Summary`}
  subtitle={`Financial Year ${taxDeclaration.financialYear}`}
  bordered={false}
  icon={ReceiptIndianRupee}
  shadow="none"
>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto p-4">
    <!-- Left Column - Income Section -->
    <div
      class="rounded-lg bg-white shadow-sm border border-gray-100 overflow-hidden"
    >
      <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 class="text-sm font-semibold text-gray-800">Income Breakdown</h3>
      </div>
      <div class="p-6 space-y-4">
        <div
          class="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors"
        >
          <span class="text-sm text-gray-600">Annual Gross</span>
          <span class="text-base font-medium text-gray-900">
            {formatCurrency(taxDeclaration.annualGross)}
          </span>
        </div>
        <div
          class="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors"
        >
          <span class="text-sm text-gray-600">Standard Deduction</span>
          <span class="text-base font-medium text-red-600">
            - {formatCurrency(taxDeclaration.standardDeduction)}
          </span>
        </div>
        {#if taxDeclaration.regime === "old"}
          <div
            class="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors"
          >
            <span class="text-sm text-gray-600">Declared Deduction</span>
            <span class="text-base font-medium text-red-600">
              - {formatCurrency(taxDeclaration.totalDeclaredAmount)}
            </span>
          </div>
          <div
            class="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors"
          >
            <span class="text-sm text-gray-600">Verified Deduction</span>
            <span class="text-base font-medium text-gray-600">
              {formatCurrency(taxDeclaration.totalVerifiedAmount)}
            </span>
          </div>
        {/if}
        <div
          class="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center"
        >
          <span class="text-sm font-semibold text-gray-700">Taxable Income</span
          >
          <span class="text-base font-bold text-gray-900">
            {formatCurrency(taxDeclaration.initialTaxBreakdown.taxableIncome)}
          </span>
        </div>
      </div>
    </div>

    <!-- Right Column - Two Rows -->
    <div class="grid grid-rows-2 gap-6">
      <!-- Row 1 - Slab-wise Tax Table -->
      <div
        class="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden h-fit"
      >
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-800">
            Slab-wise Tax Breakdown
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-100">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Income Range
                </th>
                <th
                  class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tax Amount
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              {#each taxDeclaration.initialTaxBreakdown.slabwiseTax as slab, index}
                <tr
                  class="{index % 2 === 0
                    ? 'bg-gray-50'
                    : 'bg-white'} hover:bg-gray-100 transition-colors"
                >
                  <td class="px-6 py-3 text-sm text-gray-700">
                    {formatCurrency(slab.fromAmount)} - {formatCurrency(
                      getDisplayToAmount(
                        slab.toAmount ?? null,
                        taxDeclaration.initialTaxBreakdown.taxableIncome
                      )
                    )}
                  </td>
                  <td class="px-6 py-3 text-sm text-gray-700 text-right">
                    {formatCurrency(slab.amount)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Row 2 - Tax Calculation -->
      <div
        class="rounded-lg bg-white shadow-sm border border-gray-100 overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 class="text-sm font-semibold text-gray-800">Tax Calculation</h3>
        </div>
        <div class="p-6 space-y-4">
          <div
            class="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors"
          >
            <span class="text-sm text-gray-600">Cumulative Tax</span>
            <span class="text-base font-medium text-gray-900">
              {formatCurrency(taxDeclaration.initialTaxBreakdown.taxAmount)}
            </span>
          </div>
          <div
            class="flex justify-between items-center hover:bg-gray-50 p-2 rounded transition-colors group relative"
          >
            <span class="text-sm text-gray-600 flex items-center gap-1">
              Cess Amount
              <span
                class="text-xs text-gray-500 cursor-help group-hover:underline transition-all"
              >
                ({taxDeclaration.cessRate}%)
              </span>
            </span>
            <span class="text-base font-medium text-gray-900">
              {formatCurrency(taxDeclaration.initialTaxBreakdown.cessAmount)}
            </span>
          </div>
          <div
            class="pt-4 mt-4 border-t border-gray-100 flex justify-between items-center"
          >
            <span class="text-sm font-semibold text-gray-700">Total Tax</span>
            <span class="text-base font-bold text-gray-900">
              {formatCurrency(taxDeclaration.calculatedTaxAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</Card>
