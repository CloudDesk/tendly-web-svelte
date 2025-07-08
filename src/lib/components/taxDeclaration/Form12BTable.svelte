<script lang="ts">
    import { format } from 'date-fns';
    import { Eye, Trash  } from 'lucide-svelte';
    import { createEventDispatcher } from "svelte";
  
    export let form12BRecord: any;
    export let isAdmin: boolean = false;
  
    const dispatch = createEventDispatcher();
  
    function formatDate(dateStr: string) {
      return format(new Date(dateStr), 'dd MMM yyyy');
    }
  
    function handleAction(action: string) {
      if (form12BRecord) {
        dispatch('action', { action, record: form12BRecord });
      }
    }
  </script>
  
  {#if form12BRecord}
    <table class="table-auto border-collapse w-full text-sm bg-white shadow-md rounded overflow-hidden">
      <thead class="bg-gray-100 text-gray-600">
        <tr>
          <th class="p-3 text-left">Previous Employer</th>
          <th class="p-3 text-left">PAN</th>
          <th class="p-3 text-left">TAN</th>
          <th class="p-3 text-left">TDS Deducted</th>
          <th class="p-3 text-left">Employment Period</th>
          <th class="p-3 text-left">Status</th>
          <th class="p-3 text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-t">
          <td class="p-3">{form12BRecord.metadata.form12B.previousEmployer.name}</td>
          <td class="p-3">{form12BRecord.metadata.form12B.previousEmployer.pan}</td>
          <td class="p-3">{form12BRecord.metadata.form12B.previousEmployer.tan ?? '—'}</td>
          <td class="p-3">₹{form12BRecord.metadata.form12B.tdsDeducted.toLocaleString()}</td>
          <td class="p-3">
            {formatDate(form12BRecord.metadata.form12B.employmentPeriod.startDate)} -<br />
            {formatDate(form12BRecord.metadata.form12B.employmentPeriod.endDate)}
          </td>
          <td class="p-3">{form12BRecord.metadata.form12B.status}</td>
          <td class="p-3 text-center space-x-2">
            <button
              class="text-blue-600 hover:text-blue-800"
              title="View Document"
              on:click={() => handleAction('view')}
            >
              <Eye size={18} />
            </button>
            {#if isAdmin && form12BRecord.metadata.form12B.status !== 'Verified' && !form12BRecord.metadata.form12B.isLocked}
              <button
                class="text-red-600 hover:text-red-800"
                title="Delete"
                on:click={() => handleAction('delete')}
              >
                <Trash size={18} />
              </button>
            {/if}
          </td>
        </tr>
      </tbody>
    </table>
  {:else}
    <div class="text-center py-4 text-gray-500">No Form 12B records available.</div>
  {/if}