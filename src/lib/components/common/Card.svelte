<script lang="ts">
  import type { ComponentType } from "svelte";

  // Define types for props
  type ShadowSize = "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  type RoundedSize = "none" | "sm" | "md" | "lg" | "xl" | "full";

  // Props with defaults and types
  export let title: string = "";
  export let subtitle: string = "";
  export let footer: string | null = null;
  export let bordered: boolean = true;
  export let hoverable: boolean = false;
  export let clickable: boolean = false;
  export let selected: boolean = false;
  export let shadow: ShadowSize = "sm";
  export let rounded: RoundedSize = "md";
  export let padding: string = "p-4";
  export let width: string = "w-full";
  export let bgColor: string = "bg-white";
  export let textColor: string = "text-gray-800";
  export let headerBgColor: string = "";
  export let footerBgColor: string = "";
  export let divider: boolean = true;
  export let icon: ComponentType | null = null;
  export let iconClass: string = "h-6 w-6 text-blue-500";
  export let testId: string = "";

  // Events
  export let onClick: (event: MouseEvent | KeyboardEvent) => void = () => {};

  // Calculate dynamic classes
  $: cardClasses = [
    width,
    bgColor,
    textColor,
    `rounded-${rounded}`,
    padding,
    bordered ? "border border-gray-200" : "",
    hoverable
      ? "transition-all duration-200 hover:border-blue-400 hover:shadow-md"
      : "",
    clickable ? "cursor-pointer" : "",
    selected ? "ring-2 ring-blue-500" : "",
    shadow !== "none" ? `shadow-${shadow}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  $: headerClasses = ["mb-3", headerBgColor].filter(Boolean).join(" ");

  $: footerClasses = [
    "mt-3 pt-3",
    divider ? "border-t border-gray-200" : "",
    footerBgColor,
  ]
    .filter(Boolean)
    .join(" ");

  function handleClick(event: MouseEvent): void {
    if (clickable) {
      onClick(event);
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (clickable && event.key === "Enter") {
      onClick(event);
    }
  }
</script>

<div
  class={cardClasses}
  on:click={handleClick}
  data-testid={testId}
  role={clickable ? "button" : "region"}
  tabindex={clickable ? 0 : undefined}
  on:keydown={handleKeydown}
>
  {#if title || subtitle || icon}
    <div class={headerClasses}>
      <div class="flex items-center gap-4">
        {#if icon}
          <div class={iconClass}>
            <svelte:component this={icon} />
          </div>
        {/if}
        <div>
          {#if title}
            <h3 class="pl-2 font-medium text-lg">{title}</h3>
          {/if}
          {#if subtitle}
            <p class="pl-2 text-gray-500 text-sm">{subtitle}</p>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <div class="card-content">
    <slot />
  </div>

  {#if footer !== null}
    <div class={footerClasses}>
      {#if typeof footer === "string"}
        <p class="text-sm text-gray-500">{footer}</p>
      {:else}
        <slot name="footer" />
      {/if}
    </div>
  {/if}
</div>
