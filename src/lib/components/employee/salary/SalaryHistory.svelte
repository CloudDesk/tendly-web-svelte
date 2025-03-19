<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import { salaryAssignmentApi } from "../../../services/api/salaryAssignments";
  import type { SalaryAssignment } from "$lib/types";
  import Loader from "$lib/components/common/Loader.svelte";
  import Modal from "$lib/components/common/Modal.svelte";

  export let employeeId: string;

  let salaryAssignmentHistory = writable<SalaryAssignment[]>([]);
  let loading = writable(true);
  let error = writable(null);
  let showModal = writable(false);
  let selectedRecord = writable<SalaryAssignment | null>(null);

  // Formatter for currency display
  const formatCurrency = (value: number): string => {
    return `₹${value.toLocaleString("en-IN")}`;
  };

  onMount(async () => {
    await fetchSalaryHistory();
  });

  const fetchSalaryHistory = async () => {
    try {
      loading.set(true);
      const response: any = await salaryAssignmentApi.getByUserId(employeeId);

      if (response.success && Array.isArray(response.data))
        salaryAssignmentHistory.set(response.data as SalaryAssignment[]);
    } catch (err: any) {
      error.set(err.message);
    } finally {
      loading.set(false);
    }
  };

  const openModal = (record: SalaryAssignment) => {
    selectedRecord.set(record);
    showModal.set(true);
  };

  const closeModal = () => {
    showModal.set(false);
    selectedRecord.set(null);
  };

  /* const handleFormSubmit = async (event: CustomEvent) => {
    try {
      const formData = event.detail;

      // Extract _id for update and remove it from the formData
      const { _id, employeeId, ...data } = formData;

      // Check if employeeId is missing and assign employeeId if so
      const updatedData = {
        ...data,
        employeeId: employeeId || employeeId,
      };

      let result = await salaryAssignmentApi.update(_id, updatedData);
      if (result.success) {
        await fetchSalaryHistory();
        toast.success(`Salary Assignment updated successfully`);
      } else {
        toast.error(`Error in updating Salary Assignment`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Error in updating Salary Assignment`);
    } finally {
      closeModal();
    }
  };*/
</script>

<div class="p-6">
  {#if $loading}
    <Loader />
  {:else if $error}
    <div class="text-red-500">Error: {$error}</div>
  {:else if $salaryAssignmentHistory.length === 0}
    <div
      class="flex flex-col items-center justify-center text-center py-10 bg-gray-100 rounded-lg"
    >
      <i class="fas fa-exclamation-circle text-4xl text-gray-400 mb-4"></i>
      <p class="text-lg font-semibold">No records found</p>
      <p class="text-gray-500 mb-4">
        We couldn't find any salary structure history for this employee.
      </p>
    </div>
  {:else}
    <table class="w-full table-auto">
      <thead>
        <tr class="bg-gray-50">
          <th
            class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >Status</th
          >
          <th
            class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >Monthly Gross</th
          >
          <th
            class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >Reimbursement</th
          >
          <th
            class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >Monthly Insurance</th
          >
          <th
            class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >Effective From</th
          >
          <th
            class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >Effective To</th
          >
          <th
            class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >Actions</th
          >
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each $salaryAssignmentHistory as record, index}
          <tr class={index % 2 === 0 ? "bg-gray-100" : ""}>
            <td
              class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600"
              >{record.isActive ? "ACTIVE" : "INACTIVE"}</td
            >
            <td
              class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600"
              >{formatCurrency(Number(record.monthlyGross))}</td
            >
            <td
              class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600"
              >{formatCurrency(Number(record.reimbursement))}</td
            >
            <td
              class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600"
              >{formatCurrency(Number(record.monthlyInsurance))}</td
            >
            <td
              class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600"
              >{new Date(record.effectiveFrom).toLocaleDateString()}</td
            >
            <td
              class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600"
              >{new Date(record.effectiveTo).toLocaleDateString()}</td
            >
            <td
              class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600"
            >
              <button
                class=" w-full table-action-view"
                on:click={() => openModal(record)}>View</button
              >
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  {#if $showModal}
    <Modal title="View Salary Structure" show={$showModal} onClose={closeModal}>
      <div class="p-4">
        {#if $selectedRecord}
          <p>
            <strong>Status:</strong>
            {$selectedRecord.isActive ? "ACTIVE" : "INACTIVE"}
          </p>
          <p>
            <strong>Monthly Gross:</strong>
            {formatCurrency(Number($selectedRecord.monthlyGross))}
          </p>
          <p>
            <strong>Reimbursement:</strong>
            {formatCurrency(Number($selectedRecord.reimbursement))}
          </p>
          <p>
            <strong>Monthly Insurance:</strong>
            {formatCurrency(Number($selectedRecord.monthlyInsurance))}
          </p>
          <p>
            <strong>Effective From:</strong>
            {new Date($selectedRecord.effectiveFrom).toLocaleDateString()}
          </p>
          <p>
            <strong>Effective To:</strong>
            {new Date($selectedRecord.effectiveTo).toLocaleDateString()}
          </p>
        {/if}
      </div>
    </Modal>
  {/if}
</div>

<style>
  /* .btn {
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 4px;
    background: transparent;
    color: #676879;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  } */

  .table-auto {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    border: 1px solid #e5e7eb;
    padding: 0.5rem 1rem;
  }
  .text-red-500 {
    color: #ef4444;
  }
  .bg-gray-100 {
    background-color: #f3f4f6;
  }
  .bg-gray-50 {
    background-color: #f9fafb;
  }
</style>
