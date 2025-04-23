<script lang="ts">
  import { employeesApi, shiftsApi } from "$lib/services/api";
  import type { IShiftAssignment } from "$lib/types";
  import { fromUTCDate } from "$lib/utils/date";
  import { Pencil, Trash2 } from "lucide-svelte";
  import { onMount } from "svelte";
  import Modal from "../common/Modal.svelte";
  import ShiftAssignmentUpdate from "../management/shifts/ShiftAssignmentUpdate.svelte";

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
      employee = res.data;
    } catch (e) {
      console.log(e);
    }
  };

  const getPastShifts = async () => {
    try {
      let res = await shiftsApi.getPastShifts(employeeId);
      console.log(res, "pastShifts");
      pastShifts = res.data;
    } catch (e) {
      console.log(e);
    }
  };

  const getCurrentShift = async () => {
    try {
      let res = await shiftsApi.current(employeeId);
      console.log(res, "currentShift");
      currentShift = res.data;
    } catch (e) {
      console.log(e);
    }
  };

  const getUpcomingShift = async () => {
    try {
      let res = await shiftsApi.upcoming(employeeId);
      console.log(res, "upcomingShift");
      upcomingShift = res.data;
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
    }: // Select only required fields
    {
      shiftAssignmentId: string;
      shiftCode: string;
      shiftId: { _id: string };
      validity: { validFrom: string; validTill: string };
    } = data;
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
    } finally {
      showEditModal = false;
      selectedShiftAssignment = null;
      await getUpcomingShift();
      await getCurrentShift();
    }
  };
  onMount(() => {
    if (employeeId) {
      getEmployee();
      getPastShifts();
      getCurrentShift();
      getUpcomingShift();
    }
  });
</script>

<div class="space-y-6 p-6 bg-white rounded-lg shadow-lg">
  <div class="grid grid-cols-3 gap-6 p-6 h-[60vh]">
    <!-- Current Shift Column -->
    <div
      class="flex flex-col border-2 border-gray-200 rounded-md bg-white overflow-auto"
      role="region"
    >
      <div
        class="bg-blue-500 text-white p-4 rounded-t-md font-semibold text-center"
      >
        Current Shift
      </div>
      <div class="p-4 space-y-4 overflow-y-auto">
        {#if currentShift}
          <div class="bg-white p-4 rounded-lg shadow-md border border-gray-300">
            <div class="space-y-4">
              <div>
                <span class="text-gray-500 font-medium">Start Date:</span>
                <p class="text-gray-800 text-base">
                  {fromUTCDate(currentShift.startDate)}
                </p>
              </div>
              <div>
                <span class="text-gray-500 font-medium">End Date:</span>
                <p class="text-gray-800 text-base">
                  {fromUTCDate(currentShift.endDate)}
                </p>
              </div>
              <div>
                <span class="text-gray-500 font-medium">Shift Code:</span>
                <p class="text-gray-800 text-base">{currentShift.shiftCode}</p>
              </div>
              <div>
                <span class="text-gray-500 font-medium"
                  >Shift Assignment ID:</span
                >
                <p class="text-gray-800 text-base">{currentShift._id}</p>
              </div>
              <!-- Edit Button -->
              <div class="flex justify-end space-x-2">
                <button
                  on:click={() => currentShift && editShift(currentShift)}
                  class="text-blue-500 hover:text-blue-700"
                  disabled={!currentShift}
                >
                  <Pencil class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        {:else}
          <div
            class="bg-gray-100 p-4 rounded-lg shadow-md border border-gray-300 text-gray-700"
          >
            <p class="text-lg font-medium">No Current Shift Assigned</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Upcoming Shift Column -->
    <div
      class="flex flex-col border-2 border-gray-200 rounded-md bg-white overflow-auto"
      role="region"
    >
      <div
        class="bg-yellow-500 text-white p-4 rounded-t-md font-semibold text-center"
      >
        Upcoming Shift
      </div>
      <div class="p-4 space-y-4 overflow-y-auto">
        {#if upcomingShift}
          <div class="bg-white p-4 rounded-lg shadow-md border border-gray-300">
            <div class="space-y-4">
              <div>
                <span class="text-gray-500 font-medium">Start Date:</span>
                <p class="text-gray-800 text-base">
                  {fromUTCDate(upcomingShift.startDate)}
                </p>
              </div>
              <div>
                <span class="text-gray-500 font-medium">End Date:</span>
                <p class="text-gray-800 text-base">
                  {fromUTCDate(upcomingShift.endDate)}
                </p>
              </div>
              <div>
                <span class="text-gray-500 font-medium">Shift Code:</span>
                <p class="text-gray-800 text-base">{upcomingShift.shiftCode}</p>
              </div>
              <div>
                <span class="text-gray-500 font-medium"
                  >Shift Assignment ID:</span
                >
                <p class="text-gray-800 text-base">{upcomingShift._id}</p>
              </div>
              <!-- Edit + Delete Buttons -->
              <div class="flex justify-end space-x-2">
                <button
                  on:click={() => upcomingShift && editShift(upcomingShift)}
                  class="text-blue-500 hover:text-blue-700"
                  disabled={!upcomingShift}
                >
                  <Pencil class="w-5 h-5" />
                </button>
                <button
                  on:click={() => upcomingShift && deleteShift(upcomingShift)}
                  class="text-red-500 hover:text-red-700"
                >
                  <Trash2 class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        {:else}
          <div
            class="bg-gray-100 p-4 rounded-lg shadow-md border border-gray-300 text-gray-700"
          >
            <p class="text-lg font-medium">No Upcoming Shift Assigned</p>
          </div>
        {/if}
      </div>
    </div>

    <!-- Past Shifts Column -->
    <div
      class="flex flex-col border-2 border-gray-200 rounded-md bg-white overflow-auto"
      role="region"
    >
      <div
        class="bg-green-500 text-white p-4 rounded-t-md font-semibold text-center"
      >
        Past Shifts
      </div>
      <div class="p-4 space-y-4 overflow-y-auto">
        {#if pastShifts && pastShifts.length > 0}
          {#each pastShifts as shift}
            <div
              class="bg-white p-4 rounded-lg shadow-md border border-gray-300"
            >
              <div class="space-y-4">
                <div>
                  <span class="text-gray-500 font-medium">Start Date:</span>
                  <p class="text-gray-800 text-base">
                    {fromUTCDate(shift.startDate)}
                  </p>
                </div>
                <div>
                  <span class="text-gray-500 font-medium">End Date:</span>
                  <p class="text-gray-800 text-base">
                    {fromUTCDate(shift.endDate)}
                  </p>
                </div>
                <div>
                  <span class="text-gray-500 font-medium">Shift Code:</span>
                  <p class="text-gray-800 text-base">{shift.shiftCode}</p>
                </div>
                <div>
                  <span class="text-gray-500 font-medium"
                    >Shift Assignment ID:</span
                  >
                  <p class="text-gray-800 text-base">{shift._id}</p>
                </div>
              </div>
            </div>
          {/each}
        {:else}
          <div class="text-gray-500 text-center">No past shifts</div>
        {/if}
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
</div>

<style>
  .space-y-6 {
    margin-top: 1.5rem;
  }
</style>
