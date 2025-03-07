<script lang="ts">
  import { onMount } from "svelte";
  import { writable, derived } from "svelte/store";
  import type { TaxDeclaration } from "$lib/types";
  import Loader from "$lib/components/common/Loader.svelte";
  import { formatCurrency } from "$lib/utils/currency";

  export let taxDeclaration: TaxDeclaration | null = null;

  let loading = writable(true);
  let error = writable(null);
  let selections = writable<{ [key: string]: "approve" | "decline" | null }>(
    {}
  );

  // Derive counts of approved and declined items
  const approvedCount = derived(
    selections,
    ($selections) =>
      Object.values($selections).filter((val) => val === "approve").length
  );

  const declinedCount = derived(
    selections,
    ($selections) =>
      Object.values($selections).filter((val) => val === "decline").length
  );

  // Ensure all rows have a selection before enabling submit
  const allRowsSelected = derived(selections, ($selections) =>
    Object.values($selections).every((val) => val !== null)
  );

  function handleSubmitActions() {
    const approvedItems = Object.entries($selections)
      .filter(([_, value]) => value === "approve")
      .map(([key]) => key);

    const declinedItems = Object.entries($selections)
      .filter(([_, value]) => value === "decline")
      .map(([key]) => key);

    console.log("Submitting actions:");
    console.log("Approved:", approvedItems);
    console.log("Declined:", declinedItems);
  }

  function updateSelection(id: string, type: "approve" | "decline") {
    selections.update((s) => {
      s[id] = s[id] === type ? null : type;
      return s;
    });
  }

  // Initialize selections
  onMount(() => {
    loading.set(false);
    if (taxDeclaration && taxDeclaration.declarations) {
      const initialSelections: { [key: string]: "approve" | "decline" | null } =
        {};
      taxDeclaration.declarations.forEach((d) => {
        initialSelections[d._id] = null;
      });
      selections.set(initialSelections);
    }
  });

  function formatSectionTitle(section: string, subSection: string): string {
    return `${section} - ${subSection
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")}`;
  }
</script>

<div class="p-6">
  {#if $loading}
    <Loader />
  {:else if $error}
    <div class="text-red-500">Error: {$error}</div>
  {:else if taxDeclaration && taxDeclaration.declarations && taxDeclaration.declarations.length > 0}
    <div class="flex justify-end flex-col mb-6">
      <div class="self-end">
        <button
          class="btn-submit"
          disabled={!$allRowsSelected}
          on:click={handleSubmitActions}
        >
          Submit Actions ({$approvedCount} Approved, {$declinedCount} Rejected)
        </button>
        {#if !$allRowsSelected}
          <p class="help-text text-right mt-2">
            All rows must be either approved or declined before submitting.
          </p>
        {/if}
      </div>
    </div>

    <table class="w-full table-auto">
      <thead>
        <tr class="bg-gray-50">
          <th class="table-header">Section</th>
          <th class="table-header">Declared Amount</th>
          <th class="table-header">Max Limit</th>
          <th class="table-header">Documents</th>
          <th class="table-header text-center">Status</th>
          <th class="table-header text-center">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each taxDeclaration.declarations as record, index}
          <tr class={index % 2 === 0 ? "bg-gray-100" : ""}>
            <td class="table-cell"
              >{formatSectionTitle(record.section, record.subSection)}</td
            >
            <td class="table-cell">{formatCurrency(record.declaredAmount)}</td>
            <td class="table-cell">{formatCurrency(record.maxLimit)}</td>
            <td class="table-cell">
              {#if record.documents && record.documents.length > 0}
                {#each record.documents as doc}
                  <a
                    href={doc.documentPath}
                    target="_blank"
                    class="document-link">{doc.documentName}</a
                  ><br />
                {/each}
              {:else}
                <span class="text-gray-500">No documents</span>
              {/if}
            </td>
            <td class="table-cell text-center">
              <span class="status-badge status-{record.status}"
                >{record.status.charAt(0).toUpperCase() +
                  record.status.slice(1)}</span
              >
            </td>
            <td class="table-cell text-center">
              <div class="action-container">
                <button
                  class="action-btn approve {$selections[record._id] ===
                  'approve'
                    ? 'selected'
                    : ''}"
                  on:click={() => updateSelection(record._id, "approve")}
                >
                  Approve
                </button>
                <button
                  class="action-btn decline {$selections[record._id] ===
                  'decline'
                    ? 'selected'
                    : ''}"
                  on:click={() => updateSelection(record._id, "decline")}
                >
                  Decline
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <p>No declaration data available</p>
  {/if}
</div>

<style>
  .btn-submit {
    background-color: #3b82f6;
    color: white;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
    min-width: 250px;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .btn-submit:hover:not(:disabled) {
    background-color: #2563eb;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .btn-submit:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .help-text {
    font-size: 14px;
    color: #dc2626;
    margin-top: 8px;
  }

  .table-header {
    padding: 12px;
    text-align: left;
    font-weight: 600;
    text-transform: uppercase;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
  }

  .table-cell {
    padding: 12px;
    border: 1px solid #e5e7eb;
    font-size: 14px;
  }

  .action-container {
    display: flex;
    justify-content: center;
    gap: 8px;
  }

  .action-btn {
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid;
    transition: all 0.2s;
  }

  .action-btn.approve {
    border-color: #10b981;
    color: #10b981;
    background-color: transparent;
  }

  .action-btn.approve.selected {
    background-color: #10b981;
    color: white;
  }

  .action-btn.approve:hover:not(.selected) {
    background-color: rgba(16, 185, 129, 0.1);
  }

  .action-btn.decline {
    border-color: #ef4444;
    color: #ef4444;
    background-color: transparent;
  }

  .action-btn.decline.selected {
    background-color: #ef4444;
    color: white;
  }

  .action-btn.decline:hover:not(.selected) {
    background-color: rgba(239, 68, 68, 0.1);
  }

  .status-badge {
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 12px;
    font-weight: 500;
    background-color: #f3f4f6;
  }

  .status-badge.status-pending {
    background-color: #fef3c7;
    color: #92400e;
  }

  .document-link {
    color: #3b82f6;
    text-decoration: underline;
    font-size: 13px;
  }

  .document-link:hover {
    color: #2563eb;
  }
</style>
