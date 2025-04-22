<script lang="ts">
  import { auth } from "$lib/stores/auth";
  import { CreditCard, FileText } from "lucide-svelte";
  import { onMount } from "svelte";

  $: user = $auth.user;

  const payslipInfo = {
    latest: "March 2025",
    basic: "$4,500",
    hra: "$1,500",
    bonus: "$800",
    total: "$6,800",
  };
</script>

<div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-lg font-semibold text-gray-800 flex items-center">
      <CreditCard class="inline mr-2 text-blue-600" size={18} />
      Payslip Summary
    </h2>
    <span class="bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded"
      >Latest: {payslipInfo.latest}</span
    >
  </div>

  <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-md mb-4">
    <div class="grid grid-cols-2 gap-2 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-600">Basic:</span>
        <span class="font-medium">{payslipInfo.basic}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-600">HRA:</span>
        <span class="font-medium">{payslipInfo.hra}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-600">Bonus:</span>
        <span class="font-medium">{payslipInfo.bonus}</span>
      </div>
      <div class="flex justify-between font-semibold">
        <span>Total:</span>
        <span>{payslipInfo.total}</span>
      </div>
    </div>
  </div>

  <div class="flex space-x-2">
    <button
      class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm flex items-center justify-center"
    >
      <FileText size={16} class="mr-1" />
      Download
    </button>
    <button
      class="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-3 rounded-md text-sm"
    >
      Salary History
    </button>
  </div>
</div>
