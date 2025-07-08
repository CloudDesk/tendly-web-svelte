<script lang="ts">

  import { format } from 'date-fns';
  import { Eye } from 'lucide-svelte';

    export let form12BRecord;
    function formatDate(dateStr: string) {
    return format(new Date(dateStr), 'dd MMM yyyy');
  }

  function openForm12BFile(url: string) {
    window.open(url, '_blank');
  }

</script>
<table class="table-auto border-collapse w-full text-sm bg-white shadow-md rounded overflow-hidden">
    <thead class="bg-gray-100 text-gray-600">
      <tr>
        <th class="p-3 text-left">Previous Employer</th>
        <th class="p-3 text-left">PAN</th>
        <th class="p-3 text-left">TAN</th>
        <th class="p-3 text-left">TDS Deducted</th>
        <th class="p-3 text-left">Employment Period</th>
        <th class="p-3 text-left">Status</th>
        <th class="p-3 text-center">View</th>
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
        <td class="p-3 text-center">
          <button
            class="text-blue-600 hover:underline"
            title="View Document"
            on:click={() => openForm12BFile(form12BRecord.filePath)}
          >
            <Eye />
          </button>
        </td>
      </tr>
    </tbody>
  </table>