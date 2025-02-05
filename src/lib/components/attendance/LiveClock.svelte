<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
  
    const time = writable(new Date());
  
    onMount(() => {
      const interval = setInterval(() => {
        time.set(new Date());
      }, 1000);
  
      return () => clearInterval(interval);
    });
  </script>
  
  <div class="live-clock">
    <p>{$time.toLocaleTimeString()}</p>
  </div>
  
  <style>
    .live-clock {
      font-size: 1.5rem;
      font-weight: bold;
    }
  </style>