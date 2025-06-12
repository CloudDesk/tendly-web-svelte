<script lang="ts">
  export let summary: any; // Pass the full payroll summary JSON

  let selectedIds: string[] = [];
  let selectedCurrentStatus: string = "Draft";
  console.log(summary, "summaryTable");
  function toggleSelection(id: string) {
    if (selectedIds.includes(id)) {
      selectedIds = selectedIds.filter((i) => i !== id);
    } else {
      selectedIds.push(id);
    }
  }

  function getStatusChangeHelp(current: string, action: string): string {
    if (current === "Draft") {
      if (action === "Proceed") return "Draft → PendingApproval";
      if (action === "Cancel") return "Draft → Cancelled";
    }
    if (current === "PendingApproval") {
      if (action === "Proceed") return "PendingApproval → InPayment";
      if (action === "Cancel") return "PendingApproval → Cancelled";
    }
    return `${current} → No change`;
  }

  function getNewStatus(current: string, action: string): string {
    if (current === "Draft" && action === "Proceed") return "PendingApproval";
    if (current === "PendingApproval" && action === "Proceed")
      return "InPayment";
    return "Cancelled";
  }

  function submitBulkAction(action: "Proceed" | "Cancel") {
    const payload = {
      currentStatus: selectedCurrentStatus,
      newStatus: getNewStatus(selectedCurrentStatus, action),
      [action.toLowerCase()]: selectedIds,
    };

    console.log("Dispatching bulk update:", payload);
    // replace this with API call
  }
</script>

<!-- Summary -->
<div class="bg-gray-100 p-4 rounded-xl mb-6">
  <p class="font-semibold text-lg mb-2">Payroll Summary</p>
  <div
    class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm text-gray-700"
  >
    <div>Total Employees: {summary?.data?.totalEmployees}</div>
    <div>
      Gross Salary: ₹{summary?.data?.totalGrossSalary?.toLocaleString()}
    </div>
    <div>Deductions: ₹{summary?.data?.totalDeductions?.toLocaleString()}</div>
    <div>Net Salary: ₹{summary?.data?.totalNetSalary?.toLocaleString()}</div>
  </div>

  <div class="mt-4">
    <p class="text-sm font-medium text-gray-600 mb-1">Status Breakdown:</p>
    <ul class="list-disc list-inside text-sm text-gray-700">
      {#each Object.entries(summary?.data?.statusBreakdown || {}) as [status, count]}
        <li>{status}: {count}</li>
      {/each}
    </ul>
  </div>
</div>

<!-- Table -->
<div class="overflow-x-auto border rounded-xl">
  <table class="min-w-full divide-y divide-gray-200 text-sm">
    <thead class="bg-gray-50 text-left">
      <tr>
        <th class="px-4 py-2"
          ><input
            type="checkbox"
            on:change={(e) =>
              (selectedIds = e.target.checked
                ? summary.data.exportableDetails
                    .filter((e) => e.status === selectedCurrentStatus)
                    .map((e) => e._id)
                : [])}
          /></th
        >
        <th class="px-4 py-2">Employee Name</th>
        <th class="px-4 py-2">Monthly Gross</th>
        <th class="px-4 py-2">Net Salary</th>
        <th class="px-4 py-2">Status</th>
        <th class="px-4 py-2">Action</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100">
      {#if Array.isArray(summary?.data?.exportableDetails)}
        {#each summary?.data?.exportableDetails as row}
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2">
              {#if row.status === selectedCurrentStatus}
                <input
                  type="checkbox"
                  checked={selectedIds.includes(row._id)}
                  on:change={() => toggleSelection(row._id)}
                />
              {/if}
            </td>
            <td class="px-4 py-2">{row.employeeName}</td>
            <td class="px-4 py-2">₹{row.monthlyGross.toLocaleString()}</td>
            <td class="px-4 py-2">₹{row.netSalary.toLocaleString()}</td>
            <td class="px-4 py-2">{row.status}</td>
            <td class="px-4 py-2">
              {#if row.status === "Draft"}
                <button class="text-blue-600 hover:underline text-xs mr-2"
                  >Proceed</button
                >
                <button class="text-red-600 hover:underline text-xs"
                  >Cancel</button
                >
              {:else if row.status === "PendingApproval"}
                <button class="text-blue-600 hover:underline text-xs mr-2"
                  >Proceed</button
                >
                <button class="text-red-600 hover:underline text-xs"
                  >Cancel</button
                >
              {/if}
            </td>
          </tr>
        {/each}
      {:else}
        <tr>
          <td class="px-4 py-2 text-center text-gray-500" colspan="6">
            No records found or data is not yet loaded.
          </td>
        </tr>
      {/if}
    </tbody>
  </table>
</div>

<!-- Bulk Action Panel -->
<div class="mt-6 bg-gray-50 p-4 rounded-xl border space-y-4">
  <div class="flex items-center gap-4">
    <label class="font-medium text-sm">Current Status:</label>
    <select
      bind:value={selectedCurrentStatus}
      class="border rounded p-2 text-sm"
    >
      <option value="Draft">Draft</option>
      <option value="PendingApproval">PendingApproval</option>
    </select>
  </div>

  <div>
    <p class="text-sm text-gray-600">Action Mapping:</p>
    <ul class="list-disc ml-6 text-sm">
      <li>Proceed → {getStatusChangeHelp(selectedCurrentStatus, "Proceed")}</li>
      <li>Cancel → {getStatusChangeHelp(selectedCurrentStatus, "Cancel")}</li>
    </ul>
  </div>

  <div class="flex gap-4">
    <button
      class="bg-blue-600 text-white px-4 py-2 rounded text-sm"
      on:click={() => submitBulkAction("Proceed")}
    >
      Submit Proceed
    </button>
    <button
      class="bg-red-600 text-white px-4 py-2 rounded text-sm"
      on:click={() => submitBulkAction("Cancel")}
    >
      Submit Cancel
    </button>
  </div>
</div>

<style>
  th,
  td {
    white-space: nowrap;
  }
</style>
