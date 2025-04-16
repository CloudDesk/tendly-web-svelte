<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import type { User, IWeekendCalendar } from "$lib/types";
  import { employeesApi } from "$lib/services/api";

  export let weekendCalendar: IWeekendCalendar | null = null;
  export let selectedEmployees: Set<string> = new Set();

  const dispatch = createEventDispatcher();
  let employees: User[] = [];
  let loading = false;

  function handleEmployeeSelect(employee: User) {
    if (selectedEmployees.has(employee._id)) {
      selectedEmployees.delete(employee._id);
    } else {
      selectedEmployees.add(employee._id);
    }
    selectedEmployees = new Set(selectedEmployees); // Trigger reactivity
  }

  async function loadEmployees() {
    try {
      loading = true;
      const response = await employeesApi.list({ isActive: true });
      employees = response.data || [];
    } catch (err) {
      console.error(err);
    } finally {
      loading = false;
    }
  }

  function handleSubmit() {
    dispatch("submit", {
      weekendCalendarId: weekendCalendar?._id,
      employees: Array.from(selectedEmployees),
    });
  }

  onMount(loadEmployees);
</script>

<div>
  <div class="bg-base-200 rounded-lg p-4 mb-4">
    <h3 class="text-lg font-medium">{weekendCalendar?.name}</h3>
    <p class="text-sm text-gray-600">{weekendCalendar?.description || "No description provided."}</p>
  </div>

  <div class="overflow-x-auto">
    <table class="table w-full">
      <thead>
        <tr>
          <th>
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
          <tr>
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

  <div class="flex justify-end mt-4">
    <button
      class="btn btn-primary"
      disabled={selectedEmployees.size === 0}
      on:click={handleSubmit}
    >
      Assign Weekend Calendar
    </button>
  </div>
</div>