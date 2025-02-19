<script lang="ts">
  import { derived, writable } from "svelte/store";
  import Modal from "$lib/components/common/Modal.svelte";
  import type { EmployeeSalary, SalaryStructure } from "$lib/types";
  import Loader from "$lib/components/common/Loader.svelte";
  import SalaryDetails from "./SalaryDetails.svelte";
  import { salaryAssignmentApi } from "../../../services/api/salaryAssignments";
  import { onMount } from "svelte";
  import { salaryStructureApi } from "$lib/services/api/salaryStructure";
  import {
    DollarSign,
    Edit,
    Home,
    Car,
    Building,
    Shield,
    Heart,
    Briefcase,
    Calculator,
  } from "lucide-svelte";

  interface ProfessionalTaxSlab {
    fromAmount: number;
    toAmount?: number | null;
    taxAmount: number;
  }

  export let employeeId: string;

  const employeeSalary = writable<EmployeeSalary | null>(null);
  const salaryStructure = writable<SalaryStructure | null>(null);
  const loading = writable(false);
  const error = writable(null);
  const showModal = writable(false);
  const isEditMode = writable(false);

  function calculateProfessionalTax(
    monthlyGross: number,
    term: "monthly" | "half_yearly" | "yearly",
    slabs: ProfessionalTaxSlab[]
  ): number {
    let assessableAmount = monthlyGross;

    // Calculate the assessable amount based on term
    if (term === "half_yearly") {
      assessableAmount = monthlyGross * 6;
    } else if (term === "yearly") {
      assessableAmount = monthlyGross * 12;
    }

    // Find the applicable slab
    const applicableSlab = slabs.find(
      (slab) =>
        assessableAmount >= slab.fromAmount &&
        (slab.toAmount === null ||
          slab.toAmount === undefined ||
          assessableAmount <= slab.toAmount)
    );

    // Get the tax amount from the applicable slab
    const taxAmount = applicableSlab ? applicableSlab.taxAmount : 0;

    // If term is half_yearly or yearly, convert tax back to monthly
    if (term === "half_yearly") {
      return taxAmount / 6;
    } else if (term === "yearly") {
      return taxAmount / 12;
    }

    return taxAmount;
  }

  // Derived store for calculated salary components
  const salaryComponents = derived(
    [employeeSalary, salaryStructure],
    ([$employeeSalary, $salaryStructure]) => {
      if (!$employeeSalary || !$salaryStructure) return null;

      const monthlyGross = $employeeSalary.monthlyGross;
      const basic =
        (monthlyGross * $salaryStructure.fixedEarnings.basicPercentage) / 100;
      const hra =
        (monthlyGross * $salaryStructure.fixedEarnings.hraPercentage) / 100;
      const da =
        (monthlyGross * $salaryStructure.fixedEarnings.daPercentage) / 100;
      const otherAllowance =
        (monthlyGross *
          $salaryStructure.fixedEarnings.otherAllowancePercentage) /
        100;

      // EPF Calculations
      const epfWages = Math.min(
        basic,
        $salaryStructure.statutoryDeductions.epf.maxLimit
      );
      const epfEmployee =
        (epfWages *
          $salaryStructure.statutoryDeductions.epf.employeeContribution) /
        100;
      const epfEmployer =
        (epfWages *
          $salaryStructure.statutoryDeductions.epf.employerContribution) /
        100;

      // ESI Calculations
      let esiEmployee = 0;
      let esiEmployer = 0;
      if (
        monthlyGross <=
        $salaryStructure.statutoryDeductions.esi.applicabilityLimit
      ) {
        esiEmployee =
          (monthlyGross *
            $salaryStructure.statutoryDeductions.esi.employeeContribution) /
          100;
        esiEmployer =
          (monthlyGross *
            $salaryStructure.statutoryDeductions.esi.employerContribution) /
          100;
      }

      // Calculate Professional Tax
      const professionalTax = calculateProfessionalTax(
        monthlyGross,
        $salaryStructure.statutoryDeductions.professionalTax.term as
          | "monthly"
          | "half_yearly"
          | "yearly",
        $salaryStructure.statutoryDeductions.professionalTax.slabs
      );

      const totalDeductions = epfEmployee + esiEmployee + professionalTax;
      const netSalary = monthlyGross - totalDeductions;
      const monthlyCtc =
        monthlyGross +
        epfEmployer +
        esiEmployer +
        $employeeSalary.reimbursement +
        $employeeSalary.monthlyInsurance;

      return {
        monthly: {
          gross: monthlyGross,
          net: netSalary,
          basic,
          hra,
          da,
          otherAllowance,
          deductions: {
            epf: epfEmployee,
            esi: esiEmployee,
            professionalTax,
            total: totalDeductions,
          },
        },
        annual: {
          ctc: monthlyCtc * 12,
          gross: monthlyGross * 12,
          net: netSalary * 12,
        },
        employerContributions: {
          epf: epfEmployer,
          esi: esiEmployer,
        },
      };
    }
  );

  onMount(() => {
    getActiveAssignment();
  });

  async function getActiveAssignment() {
    loading.set(true);
    try {
      const result = await salaryAssignmentApi.getActiveByUserId(employeeId);
      if (result.success) {
        employeeSalary.set(result.data);
        await getSalaryStructure(result.data.salaryStructureId as string);
      }
    } catch (err: any) {
      error.set(err.message);
    } finally {
      loading.set(false);
    }
  }

  async function getSalaryStructure(id: string) {
    try {
      const result = await salaryStructureApi.getById(id);
      if (result.success) {
        salaryStructure.set(result.data);
      }
    } catch (err: any) {
      error.set(err.message);
    }
  }

  const handleOpenModal = (editMode = false, showConfirmation = false) => {
    if (showConfirmation) {
    }
    isEditMode.set(editMode);
    showModal.set(true);
  };

  const handleCloseModal = () => {
    showModal.set(false);
  };

  const handleFormSubmit = async (event: CustomEvent) => {
    console.log("event", event.detail);
    loading.set(true);
    try {
      let API = event.detail._id ? true : false;
      const result = API
        ? await salaryAssignmentApi.update(event.detail._id, event.detail)
        : await salaryAssignmentApi.create(event.detail);
      if (result.success) {
        await getActiveAssignment();
      }
    } catch (err: any) {
      error.set(err.message);
    } finally {
      loading.set(false);
      handleCloseModal();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };
</script>

<div class="p-2">
  <!-- Header Section -->
  <div class="flex justify-end items-center mb-6">
    {#if !$employeeSalary}
      <button class="btn btn-primary" on:click={() => handleOpenModal(false)}>
        Assign Salary Structure
      </button>
    {/if}
  </div>

  {#if $loading}
    <Loader />
  {:else if !$employeeSalary || !$salaryComponents}
    <div
      class="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg"
    >
      <Calculator class="w-16 h-16 text-gray-400 mb-4" />
      <p class="text-lg text-gray-500">No salary details found</p>
      <p class="text-sm text-gray-400 mt-1">
        Create a new record to get started
      </p>
    </div>
  {:else}
    <div class="space-y-6">
      <h3 class="text-lg font-semibold text-gray-800">Earnings</h3>

      <!-- Salary Components (First Row) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Basic -->
        <div
          class="bg-gradient-to-br from-blue-400/40 to-blue-100 rounded-xl p-6 shadow-lg"
        >
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-blue-900/70 text-sm font-medium"
                >Basic Salary</span
              >
              <span class="text-blue-900 text-xl mt-1">
                {formatCurrency($salaryComponents.monthly.basic)}
              </span>
              <span class="text-blue-900/70 text-xs mt-1">
                ({$salaryStructure.fixedEarnings.basicPercentage}% of Gross)
              </span>
            </div>
            <div class="bg-white/50 p-3 rounded-full">
              <DollarSign class="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <!-- HRA -->
        <div
          class="bg-gradient-to-br from-blue-400/40 to-blue-100 rounded-xl p-6 shadow-lg"
        >
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-blue-900/70 text-sm font-medium">HRA</span>
              <span class="text-blue-900 text-xl mt-1">
                {formatCurrency($salaryComponents.monthly.hra)}
              </span>
              <span class="text-blue-900/70 text-xs mt-1">
                ({$salaryStructure.fixedEarnings.hraPercentage}% of Gross)
              </span>
            </div>
            <div class="bg-white/50 p-3 rounded-full">
              <Home class="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <!-- Other Allowance -->
        <div
          class="bg-gradient-to-br from-blue-400/40 to-blue-100 rounded-xl p-6 shadow-lg"
        >
          <div class="flex items-center justify-between">
            <div class="flex flex-col">
              <span class="text-blue-900/70 text-sm font-medium"
                >Other Allowance</span
              >
              <span class="text-blue-900 text-xl mt-1">
                {formatCurrency($salaryComponents.monthly.otherAllowance)}
              </span>
              <span class="text-blue-900/70 text-xs mt-1">
                ({$salaryStructure.fixedEarnings.otherAllowancePercentage}% of
                Gross)
              </span>
            </div>
            <div class="bg-white/50 p-3 rounded-full">
              <Car class="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Cards Row (Second Row) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Gross Salary Card -->
        <div
          class="bg-gradient-to-br from-blue-400/40 to-blue-100 rounded-xl p-6 shadow-lg"
        >
          <div class="flex items-center justify-between mb-4">
            <span class="text-blue-900/70 text-sm font-medium"
              >Monthly Gross</span
            >
            <div class="bg-white/50 p-3 rounded-full">
              <DollarSign class="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <span class="text-blue-900 text-2xl font-semibold">
            {formatCurrency($salaryComponents.monthly.gross)}
          </span>
        </div>

        <!-- Net Salary Card -->
        <div
          class="bg-gradient-to-br from-blue-400/40 to-blue-100 rounded-xl p-6 shadow-lg"
        >
          <div class="flex items-center justify-between mb-4">
            <span class="text-blue-900/70 text-sm font-medium">Monthly Net</span
            >
            <div class="bg-white/50 p-3 rounded-full">
              <Shield class="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <span class="text-blue-900 text-2xl font-semibold">
            {formatCurrency($salaryComponents.monthly.net)}
          </span>
        </div>

        <!-- CTC Card -->
        <div
          class="bg-gradient-to-br from-blue-400/40 to-blue-100 rounded-xl p-6 shadow-lg"
        >
          <div class="flex items-center justify-between mb-4">
            <span class="text-blue-900/70 text-sm font-medium">Annual CTC</span>
            <div class="bg-white/50 p-3 rounded-full">
              <Building class="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <span class="text-blue-900 text-2xl font-semibold">
            {formatCurrency($salaryComponents.annual.ctc)}
          </span>
        </div>
      </div>

      <!-- Deductions Section (Keeps the current 4-card layout) -->
      <div class="space-y-6">
        <h3 class="text-lg font-semibold text-gray-800">Deductions</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <!-- EPF Card -->
          <div
            class="bg-gradient-to-br from-gray-600 to-gray-400 rounded-xl p-6 shadow-lg"
          >
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-white text-sm font-medium">EPF</span>
                <span class="text-white text-xl mt-1">
                  {formatCurrency($salaryComponents.monthly.deductions.epf)}
                </span>
                <span class="text-white text-xs mt-1">
                  ({$salaryStructure.statutoryDeductions.epf
                    .employeeContribution}% of Basic)
                </span>
              </div>
              <div class="bg-white/80 p-3 rounded-full">
                <Shield class="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <!-- ESI Card -->
          <div
            class="bg-gradient-to-br from-gray-600 to-gray-400 rounded-xl p-6 shadow-lg"
          >
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-white text-sm font-medium">ESI</span>
                <span class="text-white text-xl mt-1">
                  {formatCurrency($salaryComponents.monthly.deductions.esi)}
                </span>
                <span class="text-white text-xs mt-1">
                  ({$salaryStructure.statutoryDeductions.esi
                    .employeeContribution}% of Gross)
                </span>
              </div>
              <div class="bg-white/80 p-3 rounded-full">
                <Heart class="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <!-- Professional Tax Card -->
          <div
            class="bg-gradient-to-br from-gray-600 to-gray-400 rounded-xl p-6 shadow-lg"
          >
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-white text-sm font-medium"
                  >Professional Tax</span
                >
                <span class="text-white text-xl mt-1">
                  {formatCurrency(
                    $salaryComponents.monthly.deductions.professionalTax
                  )}
                </span>
                <span class="text-white text-xs mt-1 capitalize">
                  ({$salaryStructure.statutoryDeductions.professionalTax.term.replace(
                    "_",
                    " "
                  )})
                </span>
              </div>
              <div class="bg-white/80 p-3 rounded-full">
                <Briefcase class="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <!-- Total Deductions Summary Card -->
          <div
            class="bg-gradient-to-br from-gray-700 to-gray-400 rounded-xl p-6 shadow-lg"
          >
            <div class="flex items-center justify-between">
              <div class="flex flex-col">
                <span class="text-white text-sm font-medium"
                  >Total Deductions</span
                >
                <span class="text-white text-2xl font-semibold mt-1">
                  {formatCurrency($salaryComponents.monthly.deductions.total)}
                </span>
              </div>
              <div class="bg-white p-3 rounded-full">
                <Calculator class="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Edit Button -->
      <div class="flex justify-end mt-6">
        <button
          class="inline-flex items-center px-4 py-2 bg-blue-500 text-white hover:bg-blue-600
             text-sm font-medium rounded-lg transition-colors duration-200
             ease-in-out shadow-lg"
          on:click={() => handleOpenModal(true, true)}
        >
          <Edit class="w-4 h-4 mr-2 text-current" />
          Edit Employee Salary
        </button>
      </div>
    </div>
  {/if}

  <!-- Modal -->
  <Modal title="Employee Salary" show={$showModal} onClose={handleCloseModal}>
    <SalaryDetails
      bind:employeeId
      data={$employeeSalary}
      readOnly={false}
      on:submit={handleFormSubmit}
    />
  </Modal>
</div>
