<!-- Button.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";

  // Icon handling
  export let icon = null; // Font Awesome icon name like "user" or "home"
  import type { SvelteComponent } from "svelte";
  export let iconComponent: typeof SvelteComponent | null = null; // For Lucide or other SVG component icons

  // Button styling
  export let variant: keyof typeof variantClasses = "primary"; // primary, outline, text, none
  export let size: keyof typeof sizeClasses = "md"; // sm, md, lg
  export let disabled = false;
  export let fullWidth = false;

  // Optional icon configuration
  export let iconOnly = false; // If true, will only show the icon without text
  export let iconPosition: "left" | "right" = "left"; // Where to place the icon

  const dispatch = createEventDispatcher();

  // Base classes for all buttons
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 gap-2";

  // Visual style variants
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300",
    outline:
      "border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200",
    text: "text-blue-600 hover:bg-blue-50 disabled:text-blue-300",
    none: "text-gray-700 hover:bg-gray-50 disabled:text-gray-400",
  };

  // Size variants
  const sizeClasses = {
    sm: "text-sm py-1 px-3 h-8",
    md: "text-sm py-2 px-4 h-10",
    lg: "text-base py-2.5 px-5 h-12",
  };

  // Icon only sizing (square buttons)
  const iconOnlySizeClasses = {
    sm: "p-1 h-8 w-8",
    md: "p-2 h-10 w-10",
    lg: "p-2.5 h-12 w-12",
  };

  // Width classes
  const widthClass = fullWidth ? "w-full" : "";

  // Calculate the final class string, including passed class prop
  $: classes = `${baseClasses} ${variantClasses[variant]} ${
    iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size]
  } ${widthClass} ${$$props.class || ""}`.trim();
  console.log(classes, "classes", $$props.class);
  // Function to handle click with additional logic if needed
  function handleClick(event: MouseEvent) {
    if (!disabled) {
      dispatch("click", event);
    }
  }

  // Icon size based on button size
  $: iconSize = size === "lg" ? 20 : size === "md" ? 18 : 16;
</script>

<button class={classes} {disabled} on:click={handleClick} {...$$restProps}>
  {#if iconPosition === "left" && (icon || iconComponent)}
    {#if icon}
      <i class="fa-solid fa-{icon}"></i>
    {:else if iconComponent}
      <svelte:component this={iconComponent} size={iconSize} />
    {/if}
  {/if}

  {#if !iconOnly}
    <slot></slot>
  {/if}

  {#if iconPosition === "right" && (icon || iconComponent)}
    {#if icon}
      <i class="fa-solid fa-{icon}"></i>
    {:else if iconComponent}
      <svelte:component this={iconComponent} size={iconSize} />
    {/if}
  {/if}
</button>

<!-- Sample usage
 
# Button Component Usage Examples

## Basic Usage

```svelte
<Button variant="primary">Submit</Button>
<Button variant="outline">Cancel</Button>
<Button variant="text">Learn More</Button>
```

## With Font Awesome Icons

```svelte
<Button variant="primary" icon="user">User Profile</Button>
<Button variant="outline" icon="filter">Filter</Button>
<Button variant="text" icon="arrow-right" iconPosition="right">Next</Button>
```

## With Lucide Icons

```svelte
<script>
  import { User, Filter, ArrowRight } from 'lucide-svelte';
</script>

<Button variant="primary" iconComponent={User}>User Profile</Button>
<Button variant="outline" iconComponent={Filter}>Filter</Button>
<Button variant="text" iconComponent={ArrowRight} iconPosition="right">Next</Button>
```

## Icon-Only Buttons

```svelte
<script>
  import { Plus, Settings, Search } from 'lucide-svelte';
</script>

//Font Awesome icon-only 
<Button variant="primary" icon="plus" iconOnly={true} />

//Lucide icon-only 
<Button variant="outline" iconComponent={Settings} iconOnly={true} />
<Button variant="text" iconComponent={Search} iconOnly={true} />
```

## Size Variations

```svelte
<Button variant="primary" size="sm">Small</Button>
<Button variant="primary" size="md">Medium</Button>
<Button variant="primary" size="lg">Large</Button>

//Icon buttons with different sizes
<Button variant="outline" icon="filter" size="sm">Small</Button>
<Button variant="outline" icon="filter" size="md">Medium</Button>
<Button variant="outline" icon="filter" size="lg">Large</Button>
```

## Full Width Button

```svelte
<Button variant="primary" fullWidth={true}>Full Width Button</Button>
```

## Disabled State

```svelte
<Button variant="primary" disabled={true}>Disabled Primary</Button>
<Button variant="outline" disabled={true}>Disabled Outline</Button>
<Button variant="text" disabled={true}>Disabled Text</Button>
```

## Event Handling

```svelte
<script>
  function handleClick() {
    console.log('Button clicked!');
  }
</script>

<Button variant="primary" on:click={handleClick}>Click Me</Button>
```
-->

<style>
  button {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  button:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
</style>
