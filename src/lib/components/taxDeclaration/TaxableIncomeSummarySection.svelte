<script lang="ts">
  import { ReceiptIndianRupee, Calendar, TrendingUp, Shield, CheckCircle, Calculator, PieChart } from "lucide-svelte";
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

  // Calculate salary breakdown with proper date handling
  const calculateSalaryBreakdown = (salaryAssignments: any[]) => {
    const breakdown = [];
    let totalCalculated = 0;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (const assignment of salaryAssignments) {
      // Parse dates directly from ISO string to avoid timezone issues
      const fromDateStr = assignment.validFrom;
      const toDateStr = assignment.validTill;
      
      const fromYear = parseInt(fromDateStr.substring(0, 4));
      const fromMonth = parseInt(fromDateStr.substring(5, 7)) - 1; // Convert to 0-indexed
      const toYear = parseInt(toDateStr.substring(0, 4));
      const toMonth = parseInt(toDateStr.substring(5, 7)) - 1; // Convert to 0-indexed
      
      // Calculate total months: (years difference * 12) + months difference + 1
      const actualMonths = ((toYear - fromYear) * 12) + (toMonth - fromMonth) + 1;
      
      const totalAmount = actualMonths * assignment.monthlyGross;
      totalCalculated += totalAmount;

      // Format date range using parsed values
      const fromMonth_str = `${monthNames[fromMonth]} ${fromYear}`;
      const toMonth_str = `${monthNames[toMonth]} ${toYear}`;
      
      breakdown.push({
        months: actualMonths,
        dateRange: `${fromMonth_str} - ${toMonth_str}`,
        monthlyGross: assignment.monthlyGross,
        totalAmount: totalAmount,
        isActive: assignment.isActive
      });
    }

    return { breakdown, totalCalculated };
  };

  const { breakdown: salaryBreakdown, totalCalculated } = calculateSalaryBreakdown(taxDeclaration.salaryAssignments || []);

  // Get FY short format (e.g., "25-26" from "2025-2026")
  const getFYShort = (fy: string) => {
    const years = fy.split('-');
    if (years.length === 2) {
      return `${years[0].slice(-2)}-${years[1].slice(-2)}`;
    }
    return fy;
  };
</script>

<div class="min-h-screen bg-white p-4 md:p-6">
  <!-- Header Section -->
  <!-- <div class="max-w-7xl mx-auto mb-8">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <div class="p-3 bg-blue-600 rounded-xl shadow-lg">
          <ReceiptIndianRupee class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {capitalize(taxDeclaration.regime)} Regime Tax Summary
          </h1>
          <p class="text-sm text-gray-600">Financial Year {taxDeclaration.financialYear}</p>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 bg-blue-500 rounded-lg shadow-sm border border-gray-200 px-4 py-2">
          
          <Shield class="w-4 h-4 text-white" />
          <span class="text-sm font-medium text-white">Regime {(taxDeclaration.regime.toUpperCase())}</span>
          <span class="text-sm font-medium text-white">FY {getFYShort(taxDeclaration.financialYear)}</span>
        </div>
      </div>
    </div>
  </div> -->

  <Card
    title={`${capitalize(taxDeclaration.regime)} Regime Taxable Income Summary`}
    subtitle={`Financial Year ${taxDeclaration.financialYear}`}
    bordered={false}
    icon={ReceiptIndianRupee}
    shadow="none"
    padding="p-0"
    headerBgColor=''
    
  >
  <!-- Main Content Grid -->
  <div class="max-w-7xl mx-auto">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      <!-- Section 1: Salary Assignment Details -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">

          <div class="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <div class="flex items-center gap-3">
          <Calendar class="w-5 h-5 text-blue-600" />
          <h2 class="text-lg font-semibold text-gray-900">Salary Assignment Details</h2>
        </div>
        </div>
        
        <div class="">
          {#each salaryBreakdown as assignment}
            <div class=" p-4 ">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-700">{assignment.dateRange}</span>
                  {#if assignment.isActive}
                    <span class="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium">
                      Active
                    </span>
                  {/if}
                </div>
                <div class="text-sm text-gray-600">
                  {assignment.months} × {formatCurrency(assignment.monthlyGross)} = 
                  <span class="font-semibold text-gray-900">{formatCurrency(assignment.totalAmount)}</span>
                </div>
              </div>
            </div>
          {/each}
          
          <div class="bg-blue-50  p-4 ">
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-blue-800">Calculated Annual Gross</span>
              <span class="text-xl font-bold text-blue-900">{formatCurrency(totalCalculated)}</span>
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- Section 2: Tax Slab Breakdown -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-md border border-purple-100 overflow-hidden">
          <div class="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200">
       
        <div class="flex items-center gap-3 ">
          <PieChart class="w-5 h-5 text-purple-600" />
          <h2 class="text-lg font-semibold text-gray-900">Tax Slab Breakdown</h2>
        </div>
        </div>
        
        <div class="bg-white  overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Income Range
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax Amount
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                {#each taxDeclaration.initialTaxBreakdown.slabwiseTax as slab}
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-4 py-3 text-sm text-gray-700">
                      {formatCurrency(slab.fromAmount)} - {formatCurrency(
                        getDisplayToAmount(
                          slab.toAmount ?? null,
                          taxDeclaration.initialTaxBreakdown.taxableIncome
                        )
                      )}
                    </td>
                    <td class="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(slab.amount)}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>

      <!-- Section 3: Income Breakdown -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-md border border-green-100 overflow-hidden">
          <div class="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
         
        <div class="flex items-center gap-3 ">
          <TrendingUp class="w-5 h-5 text-green-600" />
          <h2 class="text-lg font-semibold text-gray-900">Income Breakdown</h2>
        </div>
        </div>
        
        <div class="p-4">
          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-600">Annual Gross Income</span>
            <span class="text-lg font-semibold text-gray-900">
              {formatCurrency(taxDeclaration.annualGross)}
            </span>
          </div>
          
          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-600">Standard Deduction</span>
            <span class="text-lg font-semibold text-red-600">
              - {formatCurrency(taxDeclaration.standardDeduction)}
            </span>
          </div>

          {#if taxDeclaration.regime === "old"}
            <div class="flex justify-between items-center py-2">
              <span class="text-sm text-gray-600">Declared Deduction</span>
              <span class="text-lg font-semibold text-red-600">
                - {formatCurrency(taxDeclaration.totalDeclaredAmount)}
              </span>
            </div>
            <div class="flex justify-between items-center py-2">
              <span class="text-sm text-gray-600">Verified Amount</span>
              <span class="text-lg font-semibold text-blue-600">
                {formatCurrency(taxDeclaration.totalVerifiedAmount)}
              </span>
            </div>
          {/if}
          
          
        </div>
        <div class="bg-green-50 p-4">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-green-800">Final Taxable Income</span>
            <span class="text-xl font-bold text-green-900">
              {formatCurrency(taxDeclaration.initialTaxBreakdown.taxableIncome)}
            </span>
          </div>
        </div>
      </div>
</div>
      <!-- Section 4: Tax Calculation Summary -->
      <div class="space-y-6">
        <div class="bg-white rounded-xl shadow-md border border-indigo-100 overflow-hidden">
          <div class="px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-200">
            
        <div class="flex items-center gap-3">
          <Calculator class="w-5 h-5 text-indigo-600" />
          <h2 class="text-lg font-semibold text-gray-900">Tax Calculation Summary</h2>
        </div>
        </div>
        <div class="p-4">
          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-600">Cumulative Tax</span>
            <span class="text-lg font-semibold text-gray-900">
              {formatCurrency(taxDeclaration.initialTaxBreakdown.taxAmount)}
            </span>
          </div>

          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-600">Tax Rebate 87A(a)</span>
            <span class="text-lg font-semibold text-red-600">
              - {formatCurrency(taxDeclaration.initialTaxBreakdown.rebateAmount)}
            </span>
          </div>

          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-600">Tax Relief 87A(b)</span>
            <span class="text-lg font-semibold text-red-600">
              - {formatCurrency(taxDeclaration.initialTaxBreakdown.marginalReliefAmount)}
            </span>
          </div>

          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-600">Net Tax after Rebate</span>
            <span class="text-lg font-semibold text-gray-900">
              {formatCurrency(taxDeclaration.initialTaxBreakdown.totalTaxAmount)}
            </span>
          </div>

          <div class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-600 flex items-center gap-1">
              Cess Amount
              <span class="text-xs text-yellow-600 font-medium">
                {taxDeclaration.cessRate}%
              </span>
            </span>
            <span class="text-lg font-semibold text-yellow-600">
              {formatCurrency(taxDeclaration.initialTaxBreakdown.cessAmount)}
            </span>
          </div>

      
        </div>
        <div class="bg-gray-900  p-4 ">
          {#if taxDeclaration.isForm12BApplicable}
            <div class="space-y-3">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-300">Tax before Form12B TDS</span>
                <span class="text-lg font-semibold text-white">
                  {formatCurrency(taxDeclaration.initialTaxBreakdown.taxWithCess)}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-300">Verified Form12B TDS</span>
                <span class="text-lg font-semibold text-red-400">
                  - {formatCurrency(taxDeclaration.initialTaxBreakdown.form12bTDSAmount)}
                </span>
              </div>
              <div class="border-t border-gray-700 pt-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-200">Final Tax Payable</span>
                  <span class="text-2xl font-bold text-white">
                    {formatCurrency(taxDeclaration.initialTaxBreakdown.finalTaxWithCess)}
                  </span>
                </div>
              </div>
            </div>
          {:else}
            <div class="flex justify-between items-center">
              <span class="text-sm font-medium text-gray-200">Total Tax Payable</span>
              <span class="text-2xl font-bold text-white">
                {formatCurrency(taxDeclaration.initialTaxBreakdown.finalTaxWithCess)}
              </span>
            </div>
          {/if}
        </div>
        </div>
      </div>
    </div>
  </div>
  </Card>
</div>