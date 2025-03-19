<script lang="ts">
  import { formatCurrency } from "$lib/utils/currency";

  export let taxDeclaration;
</script>

<table class="border-collapse border border-gray-300 w-full mt-4">
  <thead class="bg-gray-100">
    <tr>
      <th class="border border-gray-300 px-4 py-2">Month</th>
      <th class="border border-gray-300 px-4 py-2">Planned Deduction</th>
      <th class="border border-gray-300 px-4 py-2">Actual Deduction</th>
      <th class="border border-gray-300 px-4 py-2">Adjustment Amount</th>
      <th class="border border-gray-300 px-4 py-2">Processed</th>
    </tr>
  </thead>
  <tbody>
    {#each taxDeclaration?.monthlyDeductions as deduction}
      <tr class="border border-gray-300 text-center">
        <td class="border border-gray-300 px-4 py-2">{deduction.month}</td>
        <td class="border border-gray-300 px-4 py-2"
          >{formatCurrency(deduction.plannedDeduction)}</td
        >
        <td class="border border-gray-300 px-4 py-2"
          >{formatCurrency(deduction.actualDeduction)}</td
        >
        <td class="border border-gray-300 px-4 py-2"
          >{formatCurrency(deduction.adjustmentAmount)}</td
        >
        <td class="border border-gray-300 px-4 py-2"
          >{deduction.isProcessed ? "Yes" : "No"}</td
        >
      </tr>
    {/each}
  </tbody>
</table>

<style>
  /* .tax-computation {
    padding: 1rem;
  }

  .summary-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .card {
    flex: 1;
    min-width: 180px;
    background-color: #f5f5f5;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .card h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #555;
  }

  .card .amount {
    font-size: 1.25rem;
    font-weight: 600;
    color: #333;
  }

  .card.total {
    background-color: #ebf5ff;
    border-left: 4px solid #0066cc;
  }

  .card.total .amount {
    color: #0066cc;
  }

  .section-title {
    margin: 1.5rem 0 1rem;
    font-size: 1.1rem;
    color: #333;
  }

  .deduction-table {
    overflow-x: auto;
    margin-bottom: 1.5rem;
  }*/

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  th,
  td {
    padding: 0.75rem 1rem;
    text-align: right;
    border-bottom: 1px solid #eee;
  }

  th:first-child,
  td:first-child {
    text-align: left;
  }

  th {
    background-color: #f9f9f9;
    font-weight: 600;
    color: #555;
  }
  /*
  tr.past-month {
    color: #999;
    background-color: #fafafa;
  }

  .notes {
    font-size: 0.85rem;
    color: #666;
    background-color: #fffde7;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    border-left: 3px solid #ffd54f;
  }

  .notes ul {
    margin: 0;
    padding-left: 1.5rem;
  }

  .notes li {
    margin: 0.25rem 0;
  }*/
</style>
