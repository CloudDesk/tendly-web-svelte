<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { writable, derived } from "svelte/store";
  import type { TaxDeclaration } from "$lib/types";
  import Loader from "$lib/components/common/Loader.svelte";
  import { formatCurrency } from "$lib/utils/currency";
  import { auth } from "$lib/stores/auth";
  import { taxDeclarationApi } from "$lib/services/api/taxDeclaration";

  export let taxDeclaration: TaxDeclaration | null = null;

  let dispatch = createEventDispatcher();

  let loading = writable(true);
  let error = writable(null);
  let selections = writable<{ [key: string]: "approve" | "decline" | null }>(
    {}
  );
  $: user = $auth.user;
  console.log(taxDeclaration?.declarations, "taxDeclaration");

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

  // Track which rows need action (document_submitted status)
  const actionableRows = derived([selections], ([$selections]) => {
    if (!taxDeclaration || !taxDeclaration.declarations) return [];
    return taxDeclaration.declarations
      .filter((d) => d.status === "document_submitted")
      .map((d) => d.subSection);
  });

  // Check if all actionable rows have been selected
  const allActionableRowsSelected = derived(
    [selections, actionableRows],
    ([$selections, $actionableRows]) => {
      if ($actionableRows.length === 0) return false;
      return $actionableRows.every((id) => $selections[id] !== null);
    }
  );

  async function handleSubmitActions() {
    const approvedItems = Object.entries($selections)
      .filter(([_, value]) => value === "approve")
      .map(([key]) => key);

    const declinedItems = Object.entries($selections)
      .filter(([_, value]) => value === "decline")
      .map(([key]) => key);

    console.log("Submitting actions:");
    console.log("Approved:", approvedItems);
    console.log("Declined:", declinedItems);

    // Call API to update tax declaration
    try {
      if (taxDeclaration && taxDeclaration._id) {
        let response = await taxDeclarationApi.review(taxDeclaration._id, {
          approvedList: approvedItems,
          declinedList: declinedItems,
        });
        console.log(response, "response");
        dispatch("approvals");
      } else {
        throw new Error("Tax declaration or ID is missing");
      }
    } catch (error) {
      console.log(error, "error");
    }
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
        // Only allow actions for document_submitted status
        if (d.status === "document_submitted") {
          initialSelections[d.subSection] = null;
        }
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

  // Function to get status badge styles
  function getStatusBadgeStyle(status: string): string {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "verified":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "resubmission_requested":
        return "bg-orange-100 text-orange-800";
      case "document_submitted":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  // Function to get the formatted status text
  function getStatusText(status: string): string {
    switch (status) {
      case "pending":
        return "Pending";
      case "verified":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "resubmission_requested":
        return "Resubmission Requested";
      case "document_submitted":
        return "Document Submitted";
      default:
        return (
          status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")
        );
    }
  }

  // Check if a declaration can be actioned
  function canAction(status: string): boolean {
    return status === "document_submitted";
  }
</script>

<div class="p-6">
  {#if $loading}
    <Loader />
  {:else if $error}
    <div class="text-red-500">Error: {$error}</div>
  {:else if taxDeclaration && taxDeclaration.declarations && taxDeclaration.declarations.length > 0}
    <!-- Only show submit button if there are actionable items -->
    {#if taxDeclaration.declarations.some((d) => canAction(d.status))}
      <div class="flex justify-end flex-col mb-6">
        <div class="self-end">
          <button
            class="btn-submit"
            disabled={!$allActionableRowsSelected}
            on:click={handleSubmitActions}
          >
            Submit Actions ({$approvedCount} Approved, {$declinedCount} Rejected)
          </button>
          {#if !$allActionableRowsSelected}
            <p class="help-text text-right mt-2">
              All actionable rows must be either approved or declined before
              submitting.
            </p>
          {/if}
        </div>
      </div>
    {/if}

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
                    class={doc.isLatestVersion
                      ? "document-link"
                      : "document-link-old"}>{doc.documentName}</a
                  ><br />
                {/each}
              {:else}
                <span class="text-gray-500">No documents</span>
              {/if}
            </td>
            <td class="table-cell text-center">
              <span
                class={`status-badge ${getStatusBadgeStyle(record.status)}`}
              >
                {getStatusText(record.status)}
              </span>
            </td>
            <td class="table-cell text-center">
              <!-- {#if canAction(record.status)} -->
              <div class="action-container">
                <button
                  class="action-btn approve {$selections[record.subSection] ===
                  'approve'
                    ? 'selected'
                    : ''}"
                  disabled={record.status === "verified" ||
                    record.status === "rejected" ||
                    record.status === "resubmission_requested"}
                  on:click={() => updateSelection(record.subSection, "approve")}
                >
                  Approve
                </button>
                <button
                  class="action-btn decline {$selections[record.subSection] ===
                  'decline'
                    ? 'selected'
                    : ''}"
                  disabled={record.status === "verified" ||
                    record.status === "rejected" ||
                    record.status === "resubmission_requested"}
                  on:click={() => updateSelection(record.subSection, "decline")}
                >
                  Decline
                </button>
              </div>
              <!-- {:else}
                <div class="text-gray-500 text-sm">
                  {record.status === "verified"
                    ? "Already approved"
                    : record.status === "rejected"
                      ? "Already rejected"
                      : record.status === "resubmission_requested"
                        ? "Awaiting resubmission"
                        : "Not actionable"}
                </div>
              {/if} -->
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
    display: inline-block;
  }

  .document-link {
    color: #3b82f6;
    text-decoration: underline;
    font-size: 13px;
  }

  .document-link:hover {
    color: #2563eb;
  }

  .document-link-old {
    color: #ff0000;
    text-decoration: underline;
    font-size: 13px;
  }

  .document-link-old:hover {
    color: #a70000;
  }
</style>
