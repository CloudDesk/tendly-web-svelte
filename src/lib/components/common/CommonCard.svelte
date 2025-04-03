<script lang="ts">
  export let transparent = false;
  export let noPadding = false;
</script>

<div
  class={`rounded-xl ${transparent ? "" : "bg-white shadow-sm"} overflow-hidden mb-4`}
>
  {#if $$slots.header}
    <div class="p-6 border-b border-gray-200">
      <slot name="header" />
    </div>
  {/if}

  <div class={noPadding ? "" : "p-6"}>
    <slot name="content">
      <slot />
    </slot>
  </div>

  {#if $$slots.footer}
    <div class="p-6 border-t border-gray-200 bg-gray-50">
      <slot name="footer" />
    </div>
  {/if}
</div>
