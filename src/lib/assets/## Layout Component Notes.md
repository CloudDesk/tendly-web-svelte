## Layout Component Notes

- **Structure:** Uses a top-level `div` with `flex` layout.
- **Sidebar Rendering:**
  - Sidebar is conditionally rendered only when `isAuthenticated` is `true`.

- **Main Content Area (`div.flex-1`):**
  - Always takes remaining width using `flex-1`.
  - Applies smooth transition on margin changes with `transition-all duration-200`.
  - **Responsive Margin Logic:**
    - When authenticated:
      - **Sidebar open:** `ml-28` on mobile, `lg:ml-16` on large screens.
      - **Sidebar closed:** `ml-0` on mobile, `lg:ml-64` on large screens.
    - When not authenticated: No margin applied.

- **Content Wrapper:**
  - Padding applied with `p-6`.
  - Includes:
    - `<slot />` for injecting child content.
    - `<Toast />` component for notifications.

**********

## Employee Index Page Notes (`+page.svelte`)

### Layout Structure
- **Main Wrapper:** `.employees-page`
  - Applies padding (`24px`), light background (`#f6f7fb`), and full viewport height (`min-height: 100vh`).

### Header Section
- Contains page title and action buttons.
- **Style:**
  - Uses `flex` layout.
  - Aligns items center and spaces content with `justify-content: space-between`.
  - Adds bottom margin (`24px`).

- **Left Side (`.header-left`):**
  - Includes page title (`<h1>Employees>`).
  - Action buttons for filter and view toggle.

- **Right Side (`.header-right`):**
  - Buttons for **Export** and **Add Employee**.
  - `Add Employee` opens a modal via `openApplyForm`.


### Table Section
- Wrapped inside `.table-container` div.
  - **Style:**
    - White background.
    - Rounded corners (`border-radius: 8px`).
    - Subtle box shadow.

- **Table Component:**  
    - **Common Componnet:**
  - Props:
    - `columns`, `data`, `meta`, `serverSide`.
    - Event handlers: `on:search`, `on:sort`, `on:page`, `on:rowClick`.
  - Note: `currentSort` prop is removed.
  - Loading prop uses a comparison of `searchParams` for dynamic updates.

### Additional Notes
- If using this component elsewhere, ensure your table wrapper has:
  ```css
  .table-container {
    min-width: 100%;
  }

## 2. Detail Page Design Notes

### Main Wrapper
- Top-level div:
  ```html
  <div class="p-8 bg-surface-muted min-h-screen">

- Header block:
    <header class="flex justify-between items-center mb-12">
- Content Body:
<div class="space-y-8">


************

## Leave Page Design Notes

### Main Wrapper
- **Main Wrapper:** `.leaves-page`
    - Applies padding (`24px`), light background (`#f6f7fb`), and full viewport height (`min-height: 100vh`).

### Header Section
- Contains page title and action buttons.
- **Style:**
  - Uses `flex` layout.
  - Aligns items center and spaces content with `justify-content: space-between`.
  - Adds bottom margin (`24px`).

- **Left Side (`.header-left`):**
  - Includes page title (`<h1>Leaves>`).
  - Action buttons for filter and view toggle.

- **Right Side (`.header-right`):**
  - Buttons for **Export** and **Add Leave**.
  - `Add Leave` opens a modal via `openApplyForm`.


### Table Section BODY
- Wrapped inside `.table-container` div.
  - **Style:**
    - White background.
    - Rounded corners (`border-radius: 8px`).
    - Subtle box shadow.

## Leave Detail Page Design Notes

### Main Wrapper
- **Main Wrapper:** `.page-container`
  - Applies maximum width (`max-width: 1200px`) for readable layout.
  - Horizontally centers content using `margin: 0 auto`.
  - Adds overall spacing with `padding: 2rem`.

- Handles conditional states:
  - Displays **Loading**, **Error**, or the **LeaveDetails** view based on flags (`isLoading`, `error`, `leave`).
  - Content is wrapped in a generic `.card-body` (no specific styles applied to this class).

---

## LeaveDetails Component Design Notes

### Main Wrapper
- **Main Container:** `.container.mx-auto.p-6.bg-white.shadow-md.rounded-lg`
  - `container mx-auto`: Responsive width and horizontal centering.
  - `p-6`: Applies padding around the content.
  - `bg-white`: Sets clean white background.
  - `shadow-md`: Adds medium elevation shadow.
  - `rounded-lg`: Applies large rounded corners for a card look.

### Header Section
- **Header Block:**
  - Uses `flex` layout.
  - `justify-between`: Separates left and right items (e.g., title and action).
  - `items-center`: Vertically aligns the content.
  - `mb-6`: Adds space below the header for separation.

### Content Body
- **Body Section:**
  - No specific class used.
  - Content is rendered directly below the header with default flow.

---

**Usage Note:**  
Use this layout structure for clean and consistent detail pages. Wrapper ensures centered content with card styling, and flexible header allows for title/actions.
