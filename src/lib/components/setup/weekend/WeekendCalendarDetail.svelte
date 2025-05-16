<script lang="ts">
  import type { IWeekendCalendar } from "$lib/types";

  export let calendar: IWeekendCalendar | null = null;
</script>

<div>
  {#if calendar}
    <h3 class="text-lg font-medium mb-4">{calendar.name}</h3>
    <p class="text-sm text-gray-600 mb-4">{calendar.description || "No description provided."}</p>
    <table class="table-auto w-full border">
      <thead>
        <tr>
          <th class="px-4 py-2">Weekday</th>
          <th class="px-4 py-2">Occurrences</th>
        </tr>
      </thead>
      <tbody>
        {#each calendar.weekends as weekend}
          <tr>
            <td class="border px-4 py-2">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][weekend.weekday]}
            </td>
            <td class="border px-4 py-2">{weekend.occurrences?.join(", ") || "All"}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>