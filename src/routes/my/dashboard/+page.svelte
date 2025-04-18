<script lang="ts">
  import SwipesTracking from "$lib/components/attendance/SwipesTracking.svelte";
  import MyResignation from "$lib/components/employee/MyResignation.svelte";
  import { auth } from "$lib/stores/auth";
</script>

<div class="p-6">
  <h1 class="text-2xl font-bold mb-6">My Dashboard</h1>
  <div class="mt-4">
    <SwipesTracking />
    <!-- My resignation flow -->
    <MyResignation />
  </div>
</div>
