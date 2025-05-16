<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import type { Shift, IShiftAssignment } from "$lib/types";
  import { lovsApi, shiftsApi } from "$lib/services/api";

  export let shiftAssignment: IShiftAssignment;
  const dispatch = createEventDispatcher();

  console.log(shiftAssignment, "shiftAssignment update");
  let availableShifts: Shift[] = [];
  let selectedShift: Shift | null = null;
  let selectedShiftId: string = "";
  let assignmentValidFrom = shiftAssignment.startDate.split("T")[0];
  let assignmentValidTill = shiftAssignment.endDate?.split("T")[0] || "";
  let dateError = "";
  let weekends: { label: string; value: number[]; isActive: boolean }[] = [];
  let selectedWeekendDays = shiftAssignment.weekendDays || [0];
  let showMidPeriodWarning = false;

  onMount(async () => {
    const res = await shiftsApi.list();
    console.log(res, "Available shifts");
    console.log(shiftAssignment.shiftId._id, "Shift assignment shiftId");
    availableShifts = res.data;
    selectedShiftId = shiftAssignment.shiftId._id;
    selectedShift =
      availableShifts.find((s) => s._id === selectedShiftId) || null;
    selectedWeekendDays = shiftAssignment.weekendDays || [0];
    await getWeekends();
  });

  const getWeekends = async () => {
    try {
      let result = await lovsApi.getByType("weekendsettings");
      console.log(result.data?.values, "getweekends");
      weekends = result.data?.values.map((item) => ({
        label: item.label,
        value: JSON.parse(item.value),
        isActive: item.isActive,
      })) || [{ label: "Sunday Only", value: [0], isActive: true }];
      console.log(weekends, "weekends");
    } catch (err) {
      console.error(err);
    }
  };

  function handleShiftSelection(e: Event) {
    const target = e.target as HTMLSelectElement;
    const shiftId = target.value;
    selectedShift = availableShifts.find((s) => s._id === shiftId) || null;
  }

  function validateWeekendChange() {
    const originalWeekendDays = shiftAssignment.weekendDays || [0];
    console.log(originalWeekendDays, "originalWeekendDays");
    const isWeekendChanged =
      JSON.stringify(selectedWeekendDays) !==
      JSON.stringify(originalWeekendDays);
    const today = new Date().toISOString().split("T")[0];
    showMidPeriodWarning = isWeekendChanged;
    console.log(showMidPeriodWarning, "showMidPeriodWarning");
    return !showMidPeriodWarning;
  }

  function handleShiftAssignment(createNew: boolean = false) {
    if (assignmentValidTill && assignmentValidTill <= assignmentValidFrom) {
      dateError = "End date must be after start date.";
      return;
    }

    if (
      !Array.isArray(selectedWeekendDays) ||
      !selectedWeekendDays.every(
        (d) => Number.isInteger(d) && d >= 0 && d <= 6
      ) ||
      selectedWeekendDays.length === 0
    ) {
      dateError = "Please select valid weekend days.";
      return;
    }

    // if (!createNew && !validateWeekendChange()) {
    //   dateError =
    //     "Changing weekend days for a current or past period may affect calculations. Use 'Create New Assignment' instead.";
    //   return;
    // }

    // const trimmedShift = selectedShift
    //   ? {
    //       _id: selectedShift._id,
    //       name: selectedShift.name,
    //       code: selectedShift.code,
    //       startTime: selectedShift.startTime,
    //       endTime: selectedShift.endTime,
    //       graceTimeInMinutes: selectedShift.graceTimeInMinutes,
    //     }
    //   : null;

    const newAssignment = {
      shiftAssignmentId: shiftAssignment._id,
      shiftCode: selectedShift?.code,
      shiftId: selectedShiftId,
      validity: {
        validFrom: assignmentValidFrom,
        validTill: assignmentValidTill,
      },
      weekendDays: selectedWeekendDays,
      createNew, // Indicate if creating a new assignment
    };

    console.log(newAssignment, "New assignment");
    dateError = "";
    dispatch("update", newAssignment);
  }

  // Helper function to match the currently selected weekend days with the weekend options
  function getSelectedWeekendOption() {
    // Convert current selectedWeekendDays to a string for comparison
    const currentWeekendStr = JSON.stringify(selectedWeekendDays);

    // Find the matching weekend option
    const matchingWeekend = weekends.find(
      (w) => JSON.stringify(w.value) === currentWeekendStr && w.isActive
    );

    return matchingWeekend ? matchingWeekend.value : selectedWeekendDays;
  }

  // Handle weekend selection change
  function handleWeekendChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    const selectedOption = weekends.find(
      (w) => target.value === JSON.stringify(w.value)
    );

    if (selectedOption) {
      selectedWeekendDays = selectedOption.value;
      validateWeekendChange();
    }
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
      <option disabled value="">Select a shift</option>
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

  {#if showMidPeriodWarning}
    <div class="alert alert-warning">
      <span class="text-yellow-500">
        Changing weekend days for a current or past period may affect
        calculations. Consider creating a new assignment.
      </span>
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

  <div class="form-control">
    <label class="label">Weekend Days*</label>
    <select
      class="select select-bordered"
      on:change={handleWeekendChange}
      required
    >
      {#each weekends.filter((w) => w.isActive) as weekend}
        <option
          value={JSON.stringify(weekend.value)}
          selected={JSON.stringify(selectedWeekendDays) ===
            JSON.stringify(weekend.value)}
        >
          {weekend.label}
        </option>
      {/each}
    </select>
  </div>

  <div class="flex justify-end mt-4 space-x-2">
    <button
      class="btn btn-primary"
      on:click={() => handleShiftAssignment(false)}
      disabled={!assignmentValidFrom ||
        !selectedShift ||
        !selectedWeekendDays ||
        showMidPeriodWarning}
    >
      Update Shift Assignment
    </button>
    {#if showMidPeriodWarning}
      <button
        class="btn btn-secondary"
        on:click={() => handleShiftAssignment(true)}
        disabled={!assignmentValidFrom ||
          !selectedShift ||
          !selectedWeekendDays}
      >
        Create New Assignment
      </button>
    {/if}
  </div>
</div>
