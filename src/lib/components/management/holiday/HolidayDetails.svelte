<script lang="ts">
  import type { IHolidayCalendar } from "$lib/types";

  export let calendar: IHolidayCalendar | null = null;
</script>

<div>
  {#if calendar}
    <h3 class="text-lg font-medium mb-4">{calendar.name}</h3>
    <p class="text-sm text-gray-600 mb-4">{calendar.description}</p>
    <table class="table-auto w-full border">
      <thead>
        <tr>
          <th class="px-4 py-2">Date</th>
          <th class="px-4 py-2">Name</th>
          <th class="px-4 py-2">Type</th>
          <th class="px-4 py-2">Description</th>
        </tr>
      </thead>
      <tbody>
        {#each calendar.holidays as holiday}
          <tr>
            <td class="border px-4 py-2"
              >{new Date(holiday.date).toLocaleDateString()}</td
            >
            <td class="border px-4 py-2">{holiday.name}</td>
            <td class="border px-4 py-2">{holiday.type}</td>
            <td class="border px-4 py-2">{holiday.description || "N/A"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
