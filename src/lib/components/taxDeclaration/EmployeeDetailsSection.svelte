<script lang="ts">
  import Card from "$lib/components/common/Card.svelte";
  import { CircleUserRound } from "lucide-svelte";
  import { auth } from "$lib/stores/auth";
  import { fromUTCDate } from "$lib/utils/date";

  export let taxDeclaration;
  console.log(taxDeclaration);
  // Make user reactive
  $: user = $auth.user;
  console.log($auth.user);

  // Employee details to be displayed
  $: details = [
    // { label: "Email", value: user?.email || "N/A" },
    { label: "Joining Date", value: fromUTCDate(user?.joiningDate) || "N/A" },
    { label: "Annual Gross", value: taxDeclaration.annualGross || "N/A" },
    { label: "Account No", value: "N/A" },
    { label: "PAN", value: "N/A" },
    { label: "IFSC Code", value: "N/A" },
    { label: "Employee ID", value: user?.biometricId || "N/A" },
  ];
</script>

<Card
  title={user?.name}
  subtitle={user?.role}
  bordered={false}
  icon={CircleUserRound}
  shadow="none"
>
  <div class="grid grid-cols-2 gap-4">
    {#each details as detail}
      <div class="flex flex-col bg-gray-50 p-3 rounded-md shadow-sm">
        <span class="text-xs font-semibold text-gray-600 uppercase"
          >{detail.label}</span
        >
        <span class="text-sm text-gray-900">{detail.value}</span>
      </div>
    {/each}
  </div>
</Card>
