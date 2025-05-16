<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import type { User, IHolidayCalendar } from "$lib/types";
  import ConfirmDialog from "$lib/components/common/ConfirmDialog.svelte";
  import { employeesApi } from "$lib/services/api";

  export let holidayCalendar: IHolidayCalendar | null = null;

  export let selectedEmployees: Set<string> = new Set();
  console.log(holidayCalendar, "holidayCalendar");
  const dispatch = createEventDispatcher();
  let employees: User[] = [];
  let showDialog = false;
  let dialogConfig = {
    title: "Confirm Holiday Assignment",
    message: "",
    confirmText: "Proceed with Valid Assignments",
    cancelText: "Cancel",
    type: "warning" as const,
  };

  let confirmationData: {
    validEmployees: User[];
    invalidEmployees: User[];
  } = {
    validEmployees: [],
    invalidEmployees: [],
  };

  function handleEmployeeSelect(employee: User) {
    if (selectedEmployees.has(employee._id)) {
      selectedEmployees.delete(employee._id);
    } else {
      selectedEmployees.add(employee._id);
    }
    selectedEmployees = new Set(selectedEmployees); // Trigger reactivity
  }

  function prepareConfirmation() {
    const valid = [];
    const invalid = [];

    for (const empId of selectedEmployees) {
      const employee = employees.find((e) => e._id === empId);
      if (employee) {
        valid.push(employee); // No specific validation for holidays
      }
    }

    confirmationData = {
      validEmployees: valid,
      invalidEmployees: invalid,
    };

    let message = `You are about to assign the holiday calendar "${holidayCalendar?.name}" to ${valid.length} employee(s).\n\n`;

    message += "Do you want to proceed with the assignment?";

    dialogConfig = {
      ...dialogConfig,
      message,
    };

    showDialog = true;
  }

  function handleDialogConfirm() {
    handleAssignmentSubmit();
    showDialog = false;
  }

  function handleDialogCancel() {
    showDialog = false;
  }

  async function handleAssignmentSubmit() {
    if (!holidayCalendar?._id) return;

    const validEmployees = confirmationData.validEmployees.map(
      (emp) => emp._id
    );

    if (validEmployees.length === 0) {
      return;
    }

    dispatch("submit", {
      holidayCalendarId: holidayCalendar._id,
      employees: validEmployees,
    });
  }

  const loadEmployees = async () => {
    try {
      let result = await employeesApi.list({ isActive: true, limit: 100 });
      console.log(result, "loadEmployees");
      employees = result.data ?? [];
    } catch (err) {
      console.error(err);
    }
  };

  onMount(() => {
    loadEmployees();
  });
</script>

<div class="space-y-4">
  <div class="bg-base-200 rounded-lg p-4">
    <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      <div>
        <span class="text-base-content/70">Name:</span>
        <span class="ml-1">{holidayCalendar?.name}</span>
      </div>
      <div>
        <span class="text-base-content/70">Year:</span>
        <span class="ml-1">{holidayCalendar?.year}</span>
      </div>
      <div>
        <span class="text-base-content/70">Description:</span>
        <span class="ml-1">{holidayCalendar?.description || "N/A"}</span>
      </div>
      <div>
        <span class="text-base-content/70">Total Holidays:</span>
        <span class="ml-1">{holidayCalendar?.holidays.length || 0}</span>
      </div>
    </div>
  </div>

  <div class="overflow-x-auto">
    <table class="table w-full">
      <thead>
        <tr>
          <th class="w-10">
            <input
              type="checkbox"
              class="checkbox"
              checked={selectedEmployees.size === employees.length}
              on:change={(e) => {
                if (e.currentTarget.checked) {
                  employees.forEach((emp) => selectedEmployees.add(emp._id));
                } else {
                  selectedEmployees.clear();
                }
                selectedEmployees = new Set(selectedEmployees); // Trigger reactivity
              }}
            />
          </th>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        {#each employees as employee}
          <tr class="hover">
            <td>
              <input
                type="checkbox"
                class="checkbox"
                checked={selectedEmployees.has(employee._id)}
                on:change={() => handleEmployeeSelect(employee)}
              />
            </td>
            <td>{employee.name}</td>
            <td>{employee.email}</td>
            <td>{employee.role}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div class="flex justify-between items-center">
    <p class="text-sm text-base-content/70">
      {selectedEmployees.size} employee{selectedEmployees.size === 1 ? "" : "s"}
      selected
    </p>
    <button
      class="btn btn-primary"
      disabled={selectedEmployees.size === 0}
      on:click={prepareConfirmation}
    >
      Assign Holiday Calendar
    </button>
  </div>

  <ConfirmDialog
    bind:show={showDialog}
    config={dialogConfig}
    on:confirm={handleDialogConfirm}
    on:cancel={handleDialogCancel}
  />
</div>
