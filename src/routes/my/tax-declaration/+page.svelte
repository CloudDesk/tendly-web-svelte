<script lang="ts">
  import Card from "$lib/components/common/Card.svelte";
  import Loader from "$lib/components/common/Loader.svelte";
  import TaxDeclarationViewer from "$lib/components/taxDeclaration/TaxDeclarationViewer.svelte";
  import IndexPageTemplate from "$lib/components/templates/IndexPageTemplate.svelte";
  import { taxSlabApi,taxDeclarationApi } from "$lib/services/api";
  import { auth } from "$lib/stores/auth";
  import type { TaxSlab } from "$lib/types";
  import { getCurrentFinancialYear } from "$lib/utils/date";
  import { ReceiptIndianRupee } from "lucide-svelte";
  import { onMount, tick } from "svelte";

  let isLoading = false;
  let taxDeclaration: any = null;
  $: user = $auth.user;
  let taxSlabs: TaxSlab[] = [];
  let selectedRegime: "new" | "old" | null = null;
  let currentFY = getCurrentFinancialYear();
  console.log(user, "user");

  function selectRegime(regime: "new" | "old"): void {
    selectedRegime = regime;
  }

  async function fetchUserTaxDeclaration() {
    isLoading = true;
    try {
      if (user?._id) {
        try {
          const result: any = await taxDeclarationApi.getUserCurrentFY(
            user?._id || ""
          );
          console.log(result, "result");
          taxDeclaration = result.data;
        } catch (error) {
          console.error("Error fetching tax declaration:", error);
        }
      }
      await getCurrentFYTaxSlabs();
    } finally {
      isLoading = false;
    }
  }

  async function getCurrentFYTaxSlabs() {
    isLoading = true;
    try {
      const response: any = await taxSlabApi.getCurrentFY();
      console.log(response, "*****");
      if (response.success) {
        taxSlabs = [...response.data];
        await tick();
      }
    } catch (error) {
      console.error("Error fetching tax slabs:", error);
    } finally {
      isLoading = false;
    }
  }

  function formatCurrency(amount: number | null): string {
    if (amount === null) return "Above";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function findTaxSlabByRegime(regime: "new" | "old"): TaxSlab | undefined {
    return taxSlabs.find((slab) => slab.regime === regime);
  }

  async function handleSubmitRegime() {
    console.log("Submitting regime:", selectedRegime);
    isLoading = true;
    if (selectedRegime) {
      let obj = {
        employeeId: user ? user._id : "",
        regime: selectedRegime,
        financialYear: currentFY,
      };
      try {
        let result = await taxDeclarationApi.create(obj);
        console.log(result, "result");
      } catch (error) {
        console.log(error, "error ");
      } finally {
        isLoading = false;
        selectedRegime = null;
        await fetchUserTaxDeclaration();
      }
    } else {
      console.error("Regime is not selected");
      isLoading = false;
    }
  }

  const handleUpdate = async (event: CustomEvent) => {
    let updatedValue = event.detail.updatedTaxDeclaration;
    console.log(updatedValue, "updatedValue+page");
    const { updatedAt, createdAt, ...newObj } = updatedValue;

    isLoading = true;
    try {
      let res = await taxDeclarationApi.update(updatedValue._id, newObj);
      console.log(res, "result");
    } catch (error) {
      console.log(error, "error ");
    } finally {
      isLoading = false;
      selectedRegime = null;
      await fetchUserTaxDeclaration();
    }
  };

  const handleFileUpload = async (event: CustomEvent) => {
    console.log(event.detail, "handleFileUpload page");
    const files = event.detail;
    const taxDeclarationId = taxDeclaration._id;
    isLoading = true;
    try {
      let result = await taxDeclarationApi.fileUpload(taxDeclarationId, files);
      console.log(result, "result in handleFileUpload");
    } catch (error) {
      console.log(error, "error in handleFileUpload");
    } finally {
      isLoading = false;
      selectedRegime = null;
      await fetchUserTaxDeclaration();
    }
  };
  onMount(() => {
    fetchUserTaxDeclaration();
  });
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
  />
</svelte:head>

<IndexPageTemplate
  title={`Tax Declaration ${currentFY}`}
  subtitle="Tax Declaration Summary and Submission"
>
  {#if isLoading}
    <Loader />
  {/if}

  {#if !isLoading && !taxDeclaration}
    <Card
      title="Tax Regime"
      subtitle={`Please choose the Tax Regime for FY ${currentFY}`}
      bordered={true}
      shadow="md"
      icon={ReceiptIndianRupee}
    >
      <hr class="border-t border-gray-300 my-4" />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="New Tax Regime"
          subtitle="Overview and slabs for the New Tax Regime."
          bordered={true}
          selected={selectedRegime === "new"}
          clickable={true}
          hoverable={true}
          shadow="sm"
          onClick={() => selectRegime("new")}
        >
          <div class="space-y-2">
            <p class="font-medium text-green-600">Overview</p>
            <ul class="list-disc pl-5 text-sm">
              <li>Lower tax rates for most income brackets</li>
              <li>Simpler tax calculation without deductions</li>
              <li>Default regime from FY {currentFY}</li>
              <li>No deductions under Chapter VI-A</li>
              <li>No exemptions like HRA, LTA</li>
            </ul>
          </div>

          {#if taxSlabs.length > 0}
            {@const newRegimeSlab = findTaxSlabByRegime("new")}
            {#if newRegimeSlab}
              <div class="mt-4">
                <p class="font-medium text-blue-600 mb-2">Tax Slabs</p>
                <div
                  class="bg-white rounded border border-gray-200 overflow-hidden"
                >
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th
                          class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >Income Range</th
                        >
                        <th
                          class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >Tax Rate</th
                        >
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      {#each newRegimeSlab.slabs as slab}
                        <tr>
                          <td class="px-4 py-2 text-sm text-gray-700">
                            {formatCurrency(slab.fromAmount)} - {slab.toAmount ===
                            null
                              ? "∞"
                              : formatCurrency(slab.toAmount ?? null)}
                          </td>
                          <td class="px-4 py-2 text-sm text-gray-700 text-right"
                            >{slab.taxRate}%</td
                          >
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
                <p class="text-xs text-gray-500 mt-2">
                  Standard Deduction: {formatCurrency(
                    newRegimeSlab.standardDeduction
                  )} • Cess Rate: {newRegimeSlab.cessRate}%
                </p>
              </div>
            {/if}
          {/if}
        </Card>

        <Card
          title="Old Tax Regime"
          subtitle="Overview and slabs for the Old Tax Regime."
          bordered={true}
          selected={selectedRegime === "old"}
          clickable={true}
          hoverable={true}
          shadow="sm"
          onClick={() => selectRegime("old")}
        >
          <div class="space-y-2">
            <p class="font-medium text-green-600">Overview</p>
            <ul class="list-disc pl-5 text-sm">
              <li>Multiple deductions available (80C, 80D, etc.)</li>
              <li>Housing and other allowance exemptions</li>
              <li>May be beneficial for those with many investments</li>
              <li>Higher base tax rates</li>
              <li>More complex tax calculation</li>
            </ul>
          </div>

          {#if taxSlabs.length > 0}
            {@const oldRegimeSlab = findTaxSlabByRegime("old")}
            {#if oldRegimeSlab}
              <div class="mt-4">
                <p class="font-medium text-blue-600 mb-2">Tax Slabs</p>
                <div
                  class="bg-white rounded border border-gray-200 overflow-hidden"
                >
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th
                          class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >Income Range</th
                        >
                        <th
                          class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >Tax Rate</th
                        >
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      {#each oldRegimeSlab.slabs as slab}
                        <tr>
                          <td class="px-4 py-2 text-sm text-gray-700">
                            {formatCurrency(slab.fromAmount)} - {slab.toAmount ===
                            null
                              ? "∞"
                              : formatCurrency(slab.toAmount ?? null)}
                          </td>
                          <td class="px-4 py-2 text-sm text-gray-700 text-right"
                            >{slab.taxRate}%</td
                          >
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                </div>
                <p class="text-xs text-gray-500 mt-2">
                  Standard Deduction: {formatCurrency(
                    oldRegimeSlab.standardDeduction
                  )} • Cess Rate: {oldRegimeSlab.cessRate}%
                </p>
              </div>
            {/if}
          {/if}
        </Card>
      </div>

      {#if selectedRegime}
        <div class="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
          <p class="font-medium">
            You selected: <span class="text-blue-600"
              >{selectedRegime === "new" ? "New" : "Old"} Tax Regime</span
            >
          </p>
          <p class="text-sm text-gray-600 mt-2">
            {#if selectedRegime === "new"}
              You've chosen the simplified tax structure with lower rates but
              fewer deductions.
            {:else}
              You've chosen the traditional tax structure with more deductions
              and exemptions.
            {/if}
          </p>
          <button
            class="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            on:click={handleSubmitRegime}
          >
            Confirm Selection
          </button>
        </div>
      {/if}
    </Card>
  {/if}
  {#if taxDeclaration && taxSlabs.length > 0}
    <TaxDeclarationViewer
      {taxSlabs}
      {taxDeclaration}
      on:update={handleUpdate}
      on:fileupload={handleFileUpload}
    />
  {/if}
</IndexPageTemplate>
