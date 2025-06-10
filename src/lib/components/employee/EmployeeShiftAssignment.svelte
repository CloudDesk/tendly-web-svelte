<script lang="ts">
  import { employeesApi, shiftsApi } from "$lib/services/api";
  import type { IShiftAssignment } from "$lib/types";
  import { fromUTCDate } from "$lib/utils/date";
  import { Pencil, Trash2 } from "lucide-svelte";
  import { onMount } from "svelte";
  import Modal from "../common/Modal.svelte";
  import ShiftAssignmentUpdate from "../setup/shifts/ShiftAssignmentUpdate.svelte";

  export let employeeId: string;

  let employee: any;
  let pastShifts: any = [];
  let currentShift: IShiftAssignment | null = null;
  let upcomingShift: IShiftAssignment | null = null;

  let showEditModal = false;
  let showDeleteModal = false;
  let selectedShiftAssignment: IShiftAssignment | null = null;

  const getEmployee = async () => {
    try {
      let res = await employeesApi.getById(employeeId);
      console.log(res,"employee Response")
      if(res.success && res.data){
        employee = res.data;
      }
    } catch (e) {
      console.log(e,"fetchemployee error");
    }
  };

  const getPastShifts = async () => {
    try {
      let res = await shiftsApi.getPastShifts(employeeId);
      console.log(res, "pastShifts");
      if(res.success && res.data){
        pastShifts = res.data;
      }
    } catch (e) {
      console.log(e);
    }
  };

  const getCurrentShift = async () => {
    try {
      let res = await shiftsApi.current(employeeId);
      console.log(res, "currentShift");
      if(res.success && res.data){
        currentShift = res.data;
      }
    } catch (e) {
      console.log(e);
    }
  };

  const getUpcomingShift = async () => {
    try {
      let res = await shiftsApi.upcoming(employeeId);
      console.log(res, "upcomingShift");
      if(res.success && res.data){
        upcomingShift = res.data;
      }
    } catch (e) {
      console.log(e);
    }
  };

  const editShift = async (shiftAssignment: IShiftAssignment) => {
    console.log("Edit shiftAssignment", shiftAssignment);
    selectedShiftAssignment = shiftAssignment;
    showEditModal = true;

    /* let shiftAssignmentId = shiftAssignment._id;
    let shiftCode = shiftAssignment.shiftCode;
    let shiftId = shiftAssignment.shiftId;
    let validity = {
      validFrom: shiftAssignment.startDate,
      validTill: shiftAssignment.endDate,
    };
    try {
      let result = await shiftsApi.updateAssignment(
        shiftAssignmentId,
        shiftId._id,
        shiftCode,
        validity
      );
      console.log(result, "result ");
    } catch (e) {
      console.log(e);
    }
      */
  };

  const deleteShift = async (shiftAssignment: IShiftAssignment) => {
    console.log("Delete shiftAssignment", shiftAssignment);
    // Call API to delete shift, then refresh upcoming data
  };

  const handleUpdate = async (event: CustomEvent) => {
    console.log(event.detail, "handleUpdate");
    let data = event.detail;
    let {
      shiftAssignmentId,
      shiftCode,
      shiftId,
      validity,
      weekendDays,
      createNew,
    }: // Select only required fields
    {
      shiftAssignmentId: string;
      shiftCode: string;
      shiftId: string;
      validity: { validFrom: string; validTill: string };
      weekendDays: number[];
      createNew: boolean;
    } = data;
    try {
      let result = await shiftsApi.updateAssignment(
        shiftAssignmentId,
        shiftId,
        shiftCode,
        validity,
        weekendDays,
        createNew
      );
      console.log(result, "result ");
    } catch (e) {
      console.log(e);
    } finally {
      showEditModal = false;
      selectedShiftAssignment = null;
      await fetchData();
    }
  };
  const fetchData = async () => {
    await getEmployee();
    await getPastShifts();
    await getCurrentShift();
    await getUpcomingShift();
  };
  onMount(() => {
    if (employeeId) {
     fetchData();
    }
  });
</script>

<div class="container mx-auto px-4 py-6">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Current Shift Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
        <h2 class="text-white text-lg font-semibold">Current Shift</h2>
      </div>
      <div class="p-4">
        {#if currentShift}
          <div class="space-y-4">
            <div class="flex flex-col space-y-1">
              <span class="text-sm text-gray-500">Start Date</span>
              <p class="text-gray-800 font-medium">{fromUTCDate(currentShift.startDate)}</p>
            </div>
            <div class="flex flex-col space-y-1">
              <span class="text-sm text-gray-500">End Date</span>
              <p class="text-gray-800 font-medium">{fromUTCDate(currentShift.endDate)}</p>
            </div>
            <div class="flex flex-col space-y-1">
              <span class="text-sm text-gray-500">Shift Code</span>
              <p class="text-gray-800 font-medium">{currentShift.shiftCode}</p>
            </div>
            <div class="pt-4 flex justify-end">
              <button
                on:click={() => currentShift && editShift(currentShift)}
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                disabled={!currentShift}
              >
                <Pencil class="w-4 h-4 mr-2" />
                Edit
              </button>
            </div>
          </div>
        {:else}
          <div class="text-center py-8">
            <p class="text-gray-500 font-medium">No Current Shift Assigned</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Upcoming Shift Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
      <div class="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4">
        <h2 class="text-white text-lg font-semibold">Upcoming Shift</h2>
      </div>
      <div class="p-4">
        {#if upcomingShift}
          <div class="space-y-4">
            <div class="flex flex-col space-y-1">
              <span class="text-sm text-gray-500">Start Date</span>
              <p class="text-gray-800 font-medium">{fromUTCDate(upcomingShift.startDate)}</p>
            </div>
            <div class="flex flex-col space-y-1">
              <span class="text-sm text-gray-500">End Date</span>
              <p class="text-gray-800 font-medium">{fromUTCDate(upcomingShift.endDate)}</p>
            </div>
            <div class="flex flex-col space-y-1">
              <span class="text-sm text-gray-500">Shift Code</span>
              <p class="text-gray-800 font-medium">{upcomingShift.shiftCode}</p>
            </div>
            <div class="pt-4 flex justify-end space-x-2">
              <button
                on:click={() => upcomingShift && editShift(upcomingShift)}
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              >
                <Pencil class="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                on:click={() => upcomingShift && deleteShift(upcomingShift)}
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
              >
                <Trash2 class="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        {:else}
          <div class="text-center py-8">
            <p class="text-gray-500 font-medium">No Upcoming Shift Assigned</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Past Shifts Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
      <div class="bg-gradient-to-r from-green-500 to-green-600 p-4">
        <h2 class="text-white text-lg font-semibold">Past Shifts</h2>
      </div>
      <div class="p-4 max-h-[500px] overflow-y-auto">
        {#if pastShifts && pastShifts.length > 0}
          <div class="space-y-4">
            {#each pastShifts as shift}
              <div class="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div class="space-y-3">
                  <div class="flex flex-col space-y-1">
                    <span class="text-sm text-gray-500">Start Date</span>
                    <p class="text-gray-800 font-medium">{fromUTCDate(shift.startDate)}</p>
                  </div>
                  <div class="flex flex-col space-y-1">
                    <span class="text-sm text-gray-500">End Date</span>
                    <p class="text-gray-800 font-medium">{fromUTCDate(shift.endDate)}</p>
                  </div>
                  <div class="flex flex-col space-y-1">
                    <span class="text-sm text-gray-500">Shift Code</span>
                    <p class="text-gray-800 font-medium">{shift.shiftCode}</p>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="text-center py-8">
            <p class="text-gray-500 font-medium">No Past Shifts</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<Modal
  show={showEditModal}
  title="Edit Shift Assignment"
  onClose={() => {
    showEditModal = false;
    selectedShiftAssignment = null;
  }}
>
  {#if selectedShiftAssignment}
    <ShiftAssignmentUpdate
      shiftAssignment={selectedShiftAssignment}
      on:update={handleUpdate}
    />
  {/if}
</Modal>

<style>
  /* Custom scrollbar for the past shifts section */
  .overflow-y-auto {
    scrollbar-width: thin;
    scrollbar-color: #CBD5E0 #F7FAFC;
  }

  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }

  .overflow-y-auto::-webkit-scrollbar-track {
    background: #F7FAFC;
  }

  .overflow-y-auto::-webkit-scrollbar-thumb {
    background-color: #CBD5E0;
    border-radius: 3px;
  }
</style>
