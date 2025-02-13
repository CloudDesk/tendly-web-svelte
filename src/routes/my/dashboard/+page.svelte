<script lang="ts">
  import SwipesTracking from '$lib/components/attendance/SwipesTracking.svelte';
    import { auth } from '$lib/stores/auth';
  </script>
  
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">My Dashboard</h1>
    <div class="mt-4">
      <SwipesTracking />
    </div>
  </div> 