<script lang="ts">
  import { formatCurrency } from "$lib/utils/currency";
  import { onMount } from "svelte";
  import { salaryAssignmentApi } from "$lib/services/api";
  import { salaryStructureApi } from "$lib/services/api";
  import { auth } from "$lib/stores/auth";

  export let taxDeclaration;

  $: user = $auth.user;

  let salaryAssignment = null;
  let salaryStructure = null;
  let loading = true;
  let monthlyDeductions = [];

  const MONTHS = [
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
  ];

  // Get current month index (0-11 in our fiscal year array)
  const getCurrentMonthIndex = () => {
    const date = new Date();
    // Adjust for fiscal year (Apr-Mar)
    const monthIndex = date.getMonth();
    return monthIndex >= 3 ? monthIndex - 3 : monthIndex + 9;
  };

  const calculateMonthlyTax = (totalTax, currentMonthIndex) => {
    const remainingMonths = 12 - currentMonthIndex;
    const monthlyTax = Math.round(totalTax / remainingMonths);

    return MONTHS.map((month, index) => {
      // Past months have no tax deduction
      if (index < currentMonthIndex) {
        return {
          month,
          incomeTax: 0,
          professionalTax: 0,
          epf: 0,
          esi: 0,
          isPast: true,
        };
      }

      // Calculate professional tax based on month and structure
      let professionalTax = 0;
      if (salaryStructure && salaryAssignment) {
        const monthlyGross = salaryAssignment.monthlyGross;
        const ptStructure = salaryStructure.statutoryDeductions.professionalTax;

        // Find applicable PT slab
        if (ptStructure && ptStructure.slabs) {
          const applicableSlab = ptStructure.slabs.find(
            (slab) =>
              monthlyGross > slab.fromAmount &&
              (slab.toAmount === null || monthlyGross <= slab.toAmount)
          );

          if (applicableSlab) {
            // For half-yearly, apply in September and March
            if (
              ptStructure.term === "half_yearly" &&
              (month === "Sep" || month === "Mar")
            ) {
              professionalTax = applicableSlab.taxAmount;
            }
            // For monthly, apply every month
            else if (ptStructure.term === "monthly") {
              professionalTax = applicableSlab.taxAmount;
            }
          }
        }
      }

      // Calculate EPF if applicable
      let epf = 0;
      if (salaryStructure && salaryAssignment) {
        const basicPay =
          salaryAssignment.monthlyGross *
          (salaryStructure.fixedEarnings.basicPercentage / 100);
        const epfStructure = salaryStructure.statutoryDeductions.epf;

        if (epfStructure) {
          const epfableAmount = Math.min(basicPay, epfStructure.maxLimit);
          epf = Math.round(
            epfableAmount * (epfStructure.employeeContribution / 100)
          );
        }
      }

      // Calculate ESI if applicable
      let esi = 0;
      if (salaryStructure && salaryAssignment) {
        const monthlyGross = salaryAssignment.monthlyGross;
        const esiStructure = salaryStructure.statutoryDeductions.esi;

        if (esiStructure && monthlyGross <= esiStructure.applicabilityLimit) {
          esi = Math.round(
            monthlyGross * (esiStructure.employeeContribution / 100)
          );
        }
      }

      return {
        month,
        incomeTax: monthlyTax,
        professionalTax,
        epf,
        esi,
        total: monthlyTax + professionalTax + epf + esi,
        isPast: false,
      };
    });
  };

  onMount(async () => {
    try {
      // Get salary assignment
      const assignmentData: any = await salaryAssignmentApi.getActiveByUserId(
        user._id || ""
      );
      console.log(assignmentData, "assignmentData");
      salaryAssignment = assignmentData.data;

      // Get salary structure
      if (salaryAssignment) {
        const structureData: any = await salaryStructureApi.getById(
          salaryAssignment.salaryStructureId
        );
        console.log(structureData, "structureData");
        salaryStructure = structureData.data;
      }

      // Calculate monthly deductions
      const currentMonthIndex = getCurrentMonthIndex();
      monthlyDeductions = calculateMonthlyTax(
        taxDeclaration.calculatedTaxAmount,
        currentMonthIndex
      );

      // Calculate cumulative totals
      let cumulativeTotal = 0;
      monthlyDeductions = monthlyDeductions.map((deduction) => {
        cumulativeTotal += deduction.total;
        return {
          ...deduction,
          cumulative: cumulativeTotal,
        };
      });
    } catch (error) {
      console.error("Error fetching salary data:", error);
    } finally {
      loading = false;
    }
  });

  // Calculate total statutory deductions for the year
  $: totalProfessionalTax = monthlyDeductions.reduce(
    (sum, item) => sum + item.professionalTax,
    0
  );
  $: totalEpf = monthlyDeductions.reduce((sum, item) => sum + item.epf, 0);
  $: totalEsi = monthlyDeductions.reduce((sum, item) => sum + item.esi, 0);
  $: totalStatutoryDeductions = totalProfessionalTax + totalEpf + totalEsi;
  $: grandTotal = taxDeclaration.calculatedTaxAmount + totalStatutoryDeductions;
</script>

<div class="tax-computation">
  {#if loading}
    <div class="loading">Loading tax computation data...</div>
  {:else}
    <div class="summary-cards">
      <div class="card">
        <h3>Income Tax</h3>
        <div class="amount">
          {formatCurrency(taxDeclaration.calculatedTaxAmount)}
        </div>
      </div>

      <div class="card">
        <h3>Professional Tax</h3>
        <div class="amount">{formatCurrency(totalProfessionalTax)}</div>
      </div>

      <div class="card">
        <h3>EPF</h3>
        <div class="amount">{formatCurrency(totalEpf)}</div>
      </div>

      <div class="card">
        <h3>ESI</h3>
        <div class="amount">{formatCurrency(totalEsi)}</div>
      </div>

      <div class="card total">
        <h3>Total Deductions</h3>
        <div class="amount">{formatCurrency(grandTotal)}</div>
      </div>
    </div>

    <h3 class="section-title">Monthly Tax Projection and Deduction Schedule</h3>

    <div class="deduction-table">
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Income Tax</th>
            <th>Professional Tax</th>
            <th>EPF</th>
            <th>ESI</th>
            <th>Total</th>
            <th>Cumulative</th>
          </tr>
        </thead>
        <tbody>
          {#each monthlyDeductions as deduction}
            <tr class={deduction.isPast ? "past-month" : ""}>
              <td>{deduction.month}</td>
              <td>{formatCurrency(deduction.incomeTax)}</td>
              <td>{formatCurrency(deduction.professionalTax)}</td>
              <td>{formatCurrency(deduction.epf)}</td>
              <td>{formatCurrency(deduction.esi)}</td>
              <td>{formatCurrency(deduction.total)}</td>
              <td>{formatCurrency(deduction.cumulative)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="notes">
      <p>
        <strong>Note:</strong> This monthly projection distributes your annual
        tax liability across the remaining months of the financial year.
        Professional Tax is applied according to the {salaryStructure
          ?.statutoryDeductions?.professionalTax?.term || "applicable"} schedule
        for {salaryStructure?.statutoryDeductions?.professionalTax?.state ||
          "your state"}.
      </p>
    </div>
  {/if}
</div>

<style>
  .tax-computation {
    padding: 1rem;
  }

  .loading {
    text-align: center;
    padding: 2rem;
    color: #666;
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
  }

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
</style>
