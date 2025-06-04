<script lang="ts">
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import ResignationPortal from "./ResignationPortal.svelte";
  import ResignationRequestsView from "./ResignationRequestsView.svelte";
  import { UserMinus } from "lucide-svelte";

  export let viewMode: "employee" | "manager" | "admin" = "employee";
  export let hideHeader: boolean = false;
  $: user = $auth.user;
  console.log(user);

  // Initialize based on role
  onMount(async () => {
    if (!user?._id) return;
    switch (viewMode) {
      case "employee":
        break;
      case "manager":
        break;
      case "admin":
        break;
    }
  });
  console.log(viewMode, " user");
</script>

<div
  class="bg-white rounded-lg shadow-sm overflow-hidden border p-4 border-gray-100"
>
  {#if !hideHeader}<h2
      class="text-lg font-semibold text-gray-800 flex items-center"
    >
      <UserMinus class="inline mr-2 text-blue-600" size={18} />
      Resignation Hub
    </h2>{/if}

  <div class="resignation-flow">
    <!-- Role-based view rendering -->
    {#if viewMode === "employee"}
      <ResignationPortal />
    {:else if viewMode === "manager"}
      <ResignationRequestsView
        role="manager"
        title="Manager – Resignation Requests"
      />
    {:else if viewMode === "admin"}
      <ResignationRequestsView
        role="admin"
        title="Resignation Requests (All)"
      />
    {/if}
  </div>
</div>
