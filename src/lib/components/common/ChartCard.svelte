<script lang="ts">
  export let title: string;
  export let subtitle: string = "";
  export let legendItems: Array<{
    label: string;
    color: string;
  }> = [];
  export let showLegend: boolean = true;
</script>

<div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-900">{title}</h3>
      {#if subtitle}
        <p class="text-sm text-gray-500">{subtitle}</p>
      {/if}
    </div>
    {#if showLegend && legendItems && legendItems.length > 0}
      <div class="flex items-center space-x-2">
        {#each legendItems as item}
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full mr-2" style="background-color: {item.color}"></div>
            <span class="text-xs text-gray-600">{item.label}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  <div class="h-64">
    <slot />
  </div>
  
  <slot name="footer" />
</div> 