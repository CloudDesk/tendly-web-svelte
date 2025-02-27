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
  <div class="grid grid-cols-2 grid-rows-1 gap-6">
    <div class="space-y-6">
      <!-- Income Section -->
      <div class="rounded-lg bg-gray-50 border border-gray-200">
        <div class="px-4 py-3 border-b border-gray-200">
          <h3 class="text-sm font-medium text-gray-700">Income Breakdown</h3>
        </div>
        <div class="p-4 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Annual Gross</span>
            <span class="text-base font-medium"
              >{formatCurrency(taxDeclaration.annualGross)}</span
            >
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Standard Deduction</span>
            <span class="text-base font-medium text-red-600"
              >- {formatCurrency(taxDeclaration.standardDeduction)}</span
            >
          </div>
          <div
            class="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center"
          >
            <span class="text-sm font-medium text-gray-700">Taxable Income</span
            >
            <span class="text-base font-semibold"
              >{formatCurrency(
                taxDeclaration.initialTaxBreakdown.taxableIncome
              )}</span
            >
          </div>
        </div>
      </div>

      <!-- Tax Calculation Section -->
      <div class="rounded-lg bg-gray-50 border border-gray-200">
        <div class="px-4 py-3 border-b border-gray-200">
          <h3 class="text-sm font-medium text-gray-700">Tax Calculation</h3>
        </div>
        <div class="p-4 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600">Cumulative Tax</span>
            <span class="text-base font-medium"
              >{formatCurrency(
                taxDeclaration.initialTaxBreakdown.taxAmount
              )}</span
            >
          </div>
          <div class="flex justify-between items-center group relative">
            <span class="text-sm text-gray-600 flex items-center gap-1">
              Cess Amount
              <span
                class="text-xs text-gray-500 cursor-help group-hover:underline"
              >
                ({taxDeclaration.cessRate}%)
              </span>
            </span>
            <span class="text-base font-medium"
              >{formatCurrency(
                taxDeclaration.initialTaxBreakdown.cessAmount
              )}</span
            >
          </div>
          <div
            class="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center"
          >
            <span class="text-sm font-medium text-gray-700">Total Tax</span>
            <span class="text-base font-semibold text-gray-900"
              >{formatCurrency(taxDeclaration.calculatedTaxAmount)}</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Slab-wise Tax Table -->
    <div
      class="bg-white rounded-lg overflow-hidden border border-gray-200 h-fit"
    >
      <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 class="text-sm font-medium text-gray-700">
          Slab-wise Tax Breakdown
        </h3>
      </div>
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Income Range
            </th>
            <th
              class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Tax Amount
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each taxDeclaration.initialTaxBreakdown.slabwiseTax as slab, index}
            <tr class={index % 2 === 0 ? "bg-gray-50" : ""}>
              <td class="px-3 py-2 text-xs text-gray-700">
                {formatCurrency(slab.fromAmount)} - {formatCurrency(
                  getDisplayToAmount(
                    slab.toAmount ?? null,
                    taxDeclaration.initialTaxBreakdown.taxableIncome
                  )
                )}
              </td>
              <td class="px-3 py-2 text-xs text-gray-700 text-right">
                {formatCurrency(slab.amount)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div></Card
>
