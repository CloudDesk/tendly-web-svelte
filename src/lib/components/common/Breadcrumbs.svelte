<script lang="ts">
  export let items: { label: string; href: string | null }[] = [];
  // items structure: [{label: 'Home', href: '/'}, {label: 'Current', href: null}]
</script>

<nav class="breadcrumbs flex items-center text-sm mb-6">
  <ol class="flex items-center flex-wrap gap-2">
    {#each items as item, i}
      <li class="flex items-center">
        {#if item.href}
          <a
            href={item.href}
            class="text-gray-500 hover:text-primary transition-colors"
          >
            {item.label}
          </a>
        {:else}
          <span class="text-gray-900 font-medium">{item.label}</span>
        {/if}

        {#if i < items.length - 1}
          <svg
            class="mx-2 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
