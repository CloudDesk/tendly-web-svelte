<script lang="ts">
  import { onMount } from "svelte";
  import { auth } from "$lib/stores/auth";
  import ResignationPortal from "./ResignationPortal.svelte";
  import ResignationRequestsView from "./ResignationRequestsView.svelte";

  export let viewMode: "employee" | "manager" | "admin" = "employee";

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
</script>

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
    <ResignationRequestsView role="admin" title="Resignation Requests (All)" />
  {/if}
</div>
