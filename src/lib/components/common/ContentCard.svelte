<script lang="ts">
  export let title = "";
  export let subtitle = "";
  export let flat = false;
  export let noPadding = false;
  export let headerAction = null;
</script>

<div
  class="content-card {flat
    ? 'border border-gray-200'
    : ''} bg-white rounded-lg {noPadding ? 'overflow-hidden' : 'p-6'} mb-6"
>
  <!--   class="content-card {flat
    ? 'border border-gray-200'
    : 'shadow-sm'} bg-white rounded-lg {noPadding
    ? 'overflow-hidden'
    : 'p-6'} mb-6" -->
  {#if title || subtitle || headerAction}
    <div
      class="card-header {noPadding
        ? 'px-6 pt-6'
        : ''} mb-4 flex justify-between items-start"
    >
      <div>
        {#if title}
          <h2 class="text-lg font-medium text-gray-900">{title}</h2>
        {/if}
        {#if subtitle}
          <p class="text-sm text-gray-500 mt-1">{subtitle}</p>
        {/if}
      </div>

      {#if headerAction}
        <div class="ml-4">
          <slot name="headerAction" />
        </div>
      {/if}
    </div>
  {/if}

  <div class="card-body {noPadding && (title || subtitle) ? 'px-6 pb-6' : ''}">
    <slot />
  </div>
</div>
