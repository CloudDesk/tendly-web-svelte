# Dashboard Components

This directory contains reusable components for building modern HRMS dashboards.

## Components

### DashboardCard.svelte

A reusable card component for displaying metrics with icons and gradients.

**Props:**
- `title: string` - The card title
- `value: string | number` - The main value to display
- `subtitle?: string` - Optional subtitle text
- `icon: SvelteComponent` - Lucide icon component
- `iconColor: string` - Icon color class (default: "text-white")
- `bgColor: string` - Icon background color class (default: "bg-blue-500")
- `gradientFrom: string` - Gradient start color (default: "from-blue-50")
- `gradientTo: string` - Gradient end color (default: "to-blue-100")
- `borderColor: string` - Border color class (default: "border-blue-200")
- `textColor: string` - Text color class (default: "text-blue-600")
- `valueColor: string` - Value text color class (default: "text-blue-900")
- `clickable: boolean` - Whether the card is clickable (default: false)

**Events:**
- `click` - Fired when card is clicked (if clickable)

**Usage:**
```svelte
<script>
  import { Users } from 'lucide-svelte';
  import DashboardCard from './DashboardCard.svelte';
</script>

<DashboardCard
  title="Total Employees"
  value="24"
  subtitle="Under your management"
  icon={Users}
  bgColor="bg-blue-500"
  gradientFrom="from-blue-50"
  gradientTo="to-blue-100"
  clickable={true}
  on:click={() => console.log('Card clicked')}
/>
```

### ChartCard.svelte

A reusable card component for displaying charts with titles and legends.

**Props:**
- `title: string` - The chart title
- `subtitle?: string` - Optional subtitle text
- `legendItems?: Array<{label: string, color: string}>` - Legend items
- `showLegend: boolean` - Whether to show legend (default: true)

**Slots:**
- `default` - Chart content (canvas element)
- `footer` - Footer content below the chart

**Usage:**
```svelte
<script>
  import ChartCard from './ChartCard.svelte';
</script>

<ChartCard
  title="Team Attendance Today"
  subtitle="Current day overview"
  legendItems={[
    { label: "Present", color: "#10B981" },
    { label: "On Leave", color: "#3B82F6" }
  ]}
>
  <canvas id="attendanceChart"></canvas>
  
  <svelte:fragment slot="footer">
    <div class="mt-4 grid grid-cols-2 gap-4">
      <div class="text-center">
        <p class="text-2xl font-bold text-green-600">18</p>
        <p class="text-xs text-gray-500">Present</p>
      </div>
      <div class="text-center">
        <p class="text-2xl font-bold text-blue-600">3</p>
        <p class="text-xs text-gray-500">On Leave</p>
      </div>
    </div>
  </svelte:fragment>
</ChartCard>
```

### QuickActionButton.svelte

A reusable button component for quick actions in dashboards.

**Props:**
- `icon: SvelteComponent` - Lucide icon component
- `label: string` - Button label text
- `iconColor: string` - Icon color class (default: "text-blue-600")
- `disabled: boolean` - Whether button is disabled (default: false)

**Events:**
- `click` - Fired when button is clicked

**Usage:**
```svelte
<script>
  import { UserCheck } from 'lucide-svelte';
  import QuickActionButton from './QuickActionButton.svelte';
</script>

<QuickActionButton
  icon={UserCheck}
  label="Approve Leaves"
  iconColor="text-blue-600"
  on:click={() => console.log('Button clicked')}
/>
```

## Color Schemes

The components use a consistent color scheme:

- **Blue**: Primary actions, employees, general info
- **Green**: Success states, present attendance, on-time
- **Orange**: Warnings, leaves, late arrivals
- **Purple**: Approvals, special actions
- **Red**: Errors, absent attendance
- **Gray**: Unknown states, disabled items

## Responsive Design

All components are fully responsive:
- Cards stack vertically on mobile devices
- Charts maintain aspect ratios
- Quick actions wrap to multiple rows on smaller screens

## Accessibility

Components include:
- Proper ARIA labels
- Keyboard navigation support
- High contrast color schemes
- Focus indicators
- Screen reader friendly text

## Best Practices

1. **Consistent Spacing**: Use the provided spacing classes
2. **Color Consistency**: Stick to the defined color scheme
3. **Icon Usage**: Use Lucide icons for consistency
4. **Responsive Design**: Test on different screen sizes
5. **Performance**: Lazy load charts when possible
6. **Error Handling**: Always handle loading and error states 