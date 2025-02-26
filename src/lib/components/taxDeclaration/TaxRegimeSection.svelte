<script lang="ts">
  import Card from "$lib/components/common/Card.svelte";
  import { getCurrentFinancialYear } from "$lib/utils/date";
  import type { TaxSlab } from "$lib/types/taxSlab";
  import { Landmark } from "lucide-svelte";

  export let regime: "new" | "old" | null = null;
  export let financialYear: string = getCurrentFinancialYear();
  export let taxSlabs: TaxSlab[] = [];

  const regimeDisplayName =
    regime === "new" ? "New Tax Regime" : "Old Tax Regime";
  const regimeDescription =
    regime === "new"
      ? "Lower tax rates with fewer deductions and exemptions"
      : "Higher base tax rates with multiple deductions and exemptions available";

  function formatCurrency(amount: number | null): string {
    if (amount === null) return "Above";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  const currentTaxSlab = taxSlabs.find((slab) => slab.regime === regime);

  // Calculate layout based on the number of slabs
  $: useCompactLayout = currentTaxSlab && currentTaxSlab?.slabs?.length > 4;

  // Create pairs for the compact layout
  $: slabPairs =
    useCompactLayout && currentTaxSlab?.slabs
      ? Array.from(
          { length: Math.ceil(currentTaxSlab.slabs.length / 2) },
          (_, i) => currentTaxSlab.slabs.slice(i * 2, i * 2 + 2)
        )
      : [];
</script>

<Card
  title={regimeDisplayName}
  subtitle={`Financial Year: ${financialYear}`}
  bordered={false}
  icon={Landmark}
  shadow="none"
>
  <div class="mt-3 p-3">
    <p class="text-sm text-gray-500">{regimeDescription}</p>

    {#if currentTaxSlab}
      <div class="mt-4">
        <p class="font-medium text-blue-600 mb-2">Tax Slabs</p>

        {#if !useCompactLayout}
          <!-- Standard layout for 4 or fewer slabs (single row) -->
          <div
            class="bg-white rounded-md overflow-hidden border border-gray-200"
          >
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Income Range
                  </th>
                  <th
                    class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Tax Rate
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each currentTaxSlab.slabs as slab, index}
                  <tr class={index % 2 === 0 ? "bg-gray-50" : ""}>
                    <td class="px-4 py-2 text-sm text-gray-700">
                      {formatCurrency(slab.fromAmount)} - {slab.toAmount ===
                      null
                        ? "∞"
                        : formatCurrency(slab.toAmount ?? null)}
                    </td>
                    <td class="px-4 py-2 text-sm text-gray-700 text-right">
                      {slab.taxRate}%
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <!-- Compact layout for more than 4 slabs (two items per row) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            {#each slabPairs as pair, pairIndex}
              <div
                class="bg-white rounded-md overflow-hidden border border-gray-200"
              >
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
                        Tax Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    {#each pair as slab, index}
                      <tr class={index % 2 === 0 ? "bg-gray-50" : ""}>
                        <td class="px-3 py-2 text-xs text-gray-700">
                          {formatCurrency(slab.fromAmount)} - {slab.toAmount ===
                          null
                            ? "∞"
                            : formatCurrency(slab.toAmount ?? null)}
                        </td>
                        <td class="px-3 py-2 text-xs text-gray-700 text-right">
                          {slab.taxRate}%
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/each}
          </div>
        {/if}

        <p class="text-xs text-gray-500 mt-2">
          Standard Deduction: {formatCurrency(currentTaxSlab.standardDeduction)}
          • Cess Rate: {currentTaxSlab.cessRate}%
        </p>
      </div>
    {/if}
  </div>
</Card>
