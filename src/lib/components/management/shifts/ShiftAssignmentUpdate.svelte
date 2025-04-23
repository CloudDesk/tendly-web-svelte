<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import type { Shift, IShiftAssignment } from "$lib/types";
  import { shiftsApi } from "$lib/services/api";

  export let shiftAssignment: IShiftAssignment;
  const dispatch = createEventDispatcher();

  console.log(shiftAssignment, "shiftAssignment update");
  let availableShifts: Shift[] = [];
  let selectedShift: Shift | null = null;
  let selectedShiftId: string = "";

  let assignmentValidFrom = shiftAssignment.startDate.split("T")[0];
  let assignmentValidTill = shiftAssignment.endDate?.split("T")[0] || "";

  let dateError = "";

  onMount(async () => {
    const res = await shiftsApi.list();
    console.log(res, "Available shifts");
    availableShifts = res.data;
    selectedShiftId = shiftAssignment.shiftId._id;
    selectedShift =
      availableShifts.find((s) => s._id === selectedShiftId) || null;
  });

  function handleShiftSelection(e: Event) {
    const target = e.target as HTMLSelectElement;
    const shiftId = target.value;
    selectedShift = availableShifts.find((s) => s._id === shiftId) || null;
  }

  function handleShiftAssignment() {
    if (assignmentValidTill && assignmentValidTill <= assignmentValidFrom) {
      dateError = "End date must be after start date.";
      return;
    }

    // Select only required fields
    const trimmedShift = selectedShift
      ? {
          _id: selectedShift._id,
          name: selectedShift.name,
          code: selectedShift.code,
          startTime: selectedShift.startTime,
          endTime: selectedShift.endTime,
          graceTimeInMinutes: selectedShift.graceTimeInMinutes,
        }
      : null;

    const newAssignment = {
      shiftAssignmentId: shiftAssignment._id,
      shiftCode: selectedShift?.code,
      shiftId: trimmedShift,
      validity: {
        validFrom: assignmentValidFrom,
        validTill: assignmentValidTill,
      },
    };

    console.log(newAssignment, "New assignment");
    dateError = "";
    dispatch("update", newAssignment);
  }
</script>

<div class="space-y-4">
  <div class="form-control">
    <label class="label">Select Shift*</label>
    <select
      class="select select-bordered"
      bind:value={selectedShiftId}
      on:change={handleShiftSelection}
    >
      <option disabled selected>Select a shift</option>
      {#each availableShifts as shift}
        <option value={shift._id}>{shift.name} ({shift.code})</option>
      {/each}
    </select>
  </div>

  {#if selectedShift}
    <div class="bg-base-200 rounded-lg p-4">
      <h3 class="font-medium mb-2">Selected Shift</h3>
      <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <span class="text-base-content/70">Name:</span>
          <span class="ml-1">{selectedShift.name}</span>
        </div>
        <div>
          <span class="text-base-content/70">Code:</span>
          <span class="ml-1">{selectedShift.code}</span>
        </div>
        <div>
          <span class="text-base-content/70">Timing:</span>
          <span class="ml-1"
            >{selectedShift.startTime} - {selectedShift.endTime}</span
          >
        </div>
        <div>
          <span class="text-base-content/70">Grace Time:</span>
          <span class="ml-1">{selectedShift.graceTimeInMinutes} minutes</span>
        </div>
      </div>
    </div>
  {/if}

  {#if dateError}
    <div class="alert alert-error">
      <span class="text-red-500">{dateError}</span>
    </div>
  {/if}

  <div class="grid grid-cols-2 gap-4">
    <div class="form-control">
      <label class="label">Assignment Start Date*</label>
      <input
        type="date"
        class="input input-bordered"
        bind:value={assignmentValidFrom}
        min={new Date().toISOString().split("T")[0]}
        required
      />
    </div>
    <div class="form-control">
      <label class="label">Assignment End Date</label>
      <input
        type="date"
        class="input input-bordered"
        bind:value={assignmentValidTill}
        min={assignmentValidFrom}
      />
    </div>
  </div>

  <div class="flex justify-end mt-4">
    <button
      class="btn btn-primary"
      on:click={handleShiftAssignment}
      disabled={!assignmentValidFrom || !selectedShift}
    >
      Update Shift Assignment
    </button>
  </div>
</div>
