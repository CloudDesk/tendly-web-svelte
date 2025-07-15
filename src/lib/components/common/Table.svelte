<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import type { PaginationMeta } from "$lib/types";

    type Column<T> = {
        key: keyof T;
        label: string;
        sortable?: boolean;
        type?: "checkbox" | "default";
        render?: (item: T) => string | HTMLElement | boolean;
    };

    export let data: any[] = [];
    export let columns: Column<any>[] = [];
    export let searchable: boolean = true;
    export let loading: boolean = false;
    export let error: string | null = null;
    export let meta: PaginationMeta | null = null;
    export let serverSide: boolean = false;
    export let variant: "contained" | "transparent" = "contained";
    export let showSearchInput: boolean = true;

    let searchQuery = "";
    let sortKey: string | null = null;
    let sortDirection: "asc" | "desc" = "asc";
    let currentPage = 1;
    let itemsPerPage = 10;
    let isMobile = false;

    const dispatch = createEventDispatcher();

    onMount(() => {
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    });

    function checkMobile() {
        isMobile = window.innerWidth < 640;
    }

    $: if (serverSide && meta) {
        currentPage = meta.page;
        itemsPerPage = meta.limit;
    }

    $: filteredData =
        !serverSide && searchQuery && searchable
            ? data.filter((item) =>
                  Object.values(item).some((value) =>
                      String(value)
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                  ),
              )
            : data;

    $: sortedData =
        !serverSide && sortKey
            ? [...filteredData].sort((a, b) => {
                  const aVal = a[sortKey!];
                  const bVal = b[sortKey!];
                  const modifier = sortDirection === "asc" ? 1 : -1;

                  if (typeof aVal === "string") {
                      return aVal.localeCompare(bVal) * modifier;
                  }
                  return (aVal - bVal) * modifier;
              })
            : filteredData;

    $: containerClasses =
        variant === "contained"
            ? "bg-white rounded-lg shadow-sm p-4"
            : "bg-transparent";

    function handleSort(column: Column<any>) {
        if (!column.sortable) return;

        if (sortKey === column.key) {
            sortDirection = sortDirection === "asc" ? "desc" : "asc";
        } else {
            sortKey = column.key as string;
            sortDirection = "asc";
        }

        if (serverSide) {
            dispatch("sort", { key: sortKey, direction: sortDirection });
        }
    }

    function handleSearch(event: Event) {
        const query = (event.target as HTMLInputElement).value;
        if (serverSide) {
            dispatch("search", { query });
        } else {
            searchQuery = query;
        }
    }

    function handlePageChange(page: number) {
        if (serverSide) {
            dispatch("page", { page });
        } else {
            currentPage = page;
        }
    }

    function handleRowClick(item: any) {
        dispatch("rowClick", item);
    }

    function handleActionClick(event: MouseEvent) {
        const button = (event.target as HTMLElement).closest("button");
        if (!button) return;

        const action = button.dataset.action;
        const id = button.dataset.id;

        if (action && id) {
            event.stopPropagation();
            dispatch("action", { action, id });
        }
    }

    function handleCheckboxChange(
        event: Event,
        item: any,
        column: Column<any>,
    ) {
        const checkbox = event.target as HTMLInputElement;
        const checked = checkbox.checked;

        event.stopPropagation();
        dispatch("checkbox-change", {
            item,
            key: column.key,
            checked,
            id: item._id || item.id,
        });
    }

    // Determine if a column is an action column
    function isActionColumn(column: Column<any>) {
        return (
            column.key === "_id" ||
            String(column.key).toLowerCase().includes("action")
        );
    }

    // Get unique key for item in list
    function getItemKey(item: any, index: number) {
        if (item._id) return item._id;
        if (item.id) return item.id;
        return index;
    }

    // Get display name for item (for accessibility)
    function getItemName(item: any, index: number): string {
        if (item.name) return item.name;
        if (item.title) return item.title;
        return `Item ${index + 1}`;
    }
</script>

<div class={`table-container ${containerClasses}`}>
    {#if searchable && showSearchInput}
        <div class="search-container">
            <input
                type="text"
                value={searchQuery}
                on:input={handleSearch}
                placeholder="Search..."
                class="search-input"
            />
        </div>
    {/if}

    {#if loading}
        <div class="loading">
            <span class="loader"></span>
            Loading...
        </div>
    {:else if error}
        <div class="error">
            {error}
        </div>
    {:else if sortedData.length === 0}
        <div class="empty">No data available</div>
    {:else}
        <!-- Desktop Table View -->
        <div class="hidden sm:block">
            <table>
                <thead>
                    <tr>
                        {#each columns as column}
                            <th
                                class:sortable={column.sortable}
                                class:sorted={sortKey === column.key}
                                class:asc={sortKey === column.key &&
                                    sortDirection === "asc"}
                                class:desc={sortKey === column.key &&
                                    sortDirection === "desc"}
                                on:click={() => handleSort(column)}
                            >
                                <div class="th-content">
                                    {column.label}
                                    {#if column.sortable}
                                        <div class="sort-indicator">
                                            <i class="sort-arrow up"></i>
                                            <i class="sort-arrow down"></i>
                                        </div>
                                    {/if}
                                </div>
                            </th>
                        {/each}
                    </tr>
                </thead>
                <tbody>
                    {#each sortedData as item}
                        <tr
                            on:click={() => handleRowClick(item)}
                            class="clickable"
                        >
                            {#each columns as column}
                                <td
                                    data-label={column.label}
                                    on:click={handleActionClick}
                                >
                                    {#if column.type === "checkbox"}
                                        <input
                                            type="checkbox"
                                            checked={column.render
                                                ? column.render(item)
                                                : item[column.key]}
                                            on:change={(e) =>
                                                handleCheckboxChange(
                                                    e,
                                                    item,
                                                    column,
                                                )}
                                            on:click={(e) =>
                                                e.stopPropagation()}
                                            class="checkbox-input"
                                        />
                                    {:else if column.render}
                                        {@html column.render(item)}
                                    {:else}
                                        {item[column.key]}
                                    {/if}
                                </td>
                            {/each}
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <!-- Mobile Card View -->
        <div class="sm:hidden space-y-4">
            {#each sortedData as item, i (getItemKey(item, i))}
                <button
                    class="mobile-card"
                    type="button"
                    aria-label={`View details for ${getItemName(item, i)}`}
                    on:click={() => handleRowClick(item)}
                >
                    <!-- Card Content -->
                    <div class="mobile-card-content">
                        {#each columns.filter((col) => !isActionColumn(col)) as column}
                            <div class="mobile-card-row">
                                <div class="mobile-card-label">
                                    {column.label}
                                </div>
                                <div class="mobile-card-value">
                                    {#if column.type === "checkbox"}
                                        <input
                                            type="checkbox"
                                            checked={column.render
                                                ? column.render(item)
                                                : item[column.key]}
                                            on:change={(e) =>
                                                handleCheckboxChange(
                                                    e,
                                                    item,
                                                    column,
                                                )}
                                            on:click={(e) =>
                                                e.stopPropagation()}
                                            class="checkbox-input"
                                        />
                                    {:else if column.render}
                                        {@html column.render(item)}
                                    {:else}
                                        {item[column.key] ?? "—"}
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>

                    <!-- Action buttons section -->
                    {#if columns.some((col) => isActionColumn(col))}
                        <div
                            class="mobile-card-actions"
                            role="group"
                            aria-label="Row actions"
                        >
                            {#each columns.filter( (col) => isActionColumn(col), ) as column}
                                {#if column.render}
                                    {@html column.render(item)}
                                {/if}
                            {/each}
                        </div>
                    {/if}
                </button>
            {/each}
        </div>

        {#if meta}
            <div class="pagination">
                <button
                    class="btn-page"
                    disabled={meta.page === 1}
                    on:click={() => handlePageChange(meta.page - 1)}
                >
                    Previous
                </button>

                <div class="page-info">
                    Page {meta.page} of {meta.totalPages}
                    <span class="total-items">({meta.total} items)</span>
                </div>

                <button
                    class="btn-page"
                    disabled={meta.page === meta.totalPages}
                    on:click={() => handlePageChange(meta.page + 1)}
                >
                    Next
                </button>
            </div>
        {/if}
    {/if}
</div>

<style>
    .table-container {
        width: 100%;
        overflow-x: auto;
    }

    .search-container {
        margin-bottom: 1rem;
    }

    .search-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.375rem;
        font-size: 0.875rem;
    }

    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
    }

    th {
        background: #f6f7fb;
        padding: 0.75rem 1rem;
        text-align: left;
        font-weight: 500;
        color: #676879;
        border-bottom: 1px solid #e5e7eb;
        position: sticky;
        top: 0;
    }

    .th-content {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    th.sortable {
        cursor: pointer;
        user-select: none;
    }

    th.sortable:hover {
        background: #f0f1f5;
    }

    .sort-indicator {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-left: 4px;
        height: 12px;
        opacity: 0.3;
    }

    th.sortable:hover .sort-indicator {
        opacity: 0.5;
    }

    th.sorted .sort-indicator {
        opacity: 1;
    }

    .sort-arrow {
        width: 0;
        height: 0;
        border-left: 4px solid transparent;
        border-right: 4px solid transparent;
    }

    .sort-arrow.up {
        border-bottom: 4px solid #676879;
    }

    .sort-arrow.down {
        border-top: 4px solid #676879;
    }

    th.asc .sort-arrow.up,
    th.desc .sort-arrow.down {
        border-bottom-color: #0073ea;
        border-top-color: #0073ea;
    }

    td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #e5e7eb;
        color: #1f2937;
    }

    tr.clickable {
        cursor: pointer;
    }

    tr.clickable:hover {
        background: #f9fafb;
    }

    /* Mobile card styles */
    .mobile-card {
        cursor: pointer;
        transition: all 0.2s;
        background-color: white;
        border-radius: 0.5rem;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        overflow: hidden;
        outline: none;
        display: block;
        width: 100%;
        text-align: left;
        font-family: inherit;
        font-size: inherit;
        padding: 0;
    }

    .mobile-card:hover,
    .mobile-card:focus {
        transform: translateY(-2px);
        box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border-color: #d1d5db;
    }

    .mobile-card-content {
        padding: 1rem;
    }

    .mobile-card-row {
        display: flex;
        flex-direction: column;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f3f4f6;
    }

    .mobile-card-row:last-of-type {
        border-bottom: none;
    }

    .mobile-card-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #6b7280;
        margin-bottom: 0.25rem;
    }

    .mobile-card-value {
        color: #1f2937;
        word-break: break-word;
    }

    .mobile-card-value :global(.avatar),
    .mobile-card-value :global(.role-badge),
    .mobile-card-value :global(.status-badge) {
        display: inline-flex;
        margin-top: 0.25rem;
    }

    .mobile-card-actions {
        margin-top: 0;
        padding: 0.75rem 1rem;
        background-color: #f9fafb;
        border-top: 1px solid #f3f4f6;
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .loading,
    .error,
    .empty {
        padding: 2rem;
        text-align: center;
        color: #6b7280;
    }

    .error {
        color: #ef4444;
    }

    .loader {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border: 2px solid #e5e7eb;
        border-top-color: #4f46e5;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-right: 0.5rem;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .pagination {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border-top: 1px solid #e5e7eb;
        margin-top: 1rem;
    }

    .btn-page {
        padding: 0.5rem 1rem;
        border: 1px solid #e5e7eb;
        background: white;
        border-radius: 0.375rem;
        color: #374151;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
    }

    .btn-page:hover:not(:disabled) {
        background: #f3f4f6;
        border-color: #d1d5db;
    }

    .btn-page:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .page-info {
        font-size: 0.875rem;
        color: #6b7280;
    }

    .total-items {
        margin-left: 0.5rem;
        color: #9ca3af;
    }

    /* Mobile card actions styling */
    .mobile-card-actions :global(button) {
        transition: transform 0.15s ease;
    }

    .mobile-card-actions :global(button:hover) {
        transform: scale(1.1);
    }

    /* Custom styling for different types of badges in mobile view */
    .mobile-card-value :global(.role-badge),
    .mobile-card-value :global(.status-badge) {
        display: inline-block;
        margin-top: 0.25rem;
    }

    /* Checkbox styling */
    .checkbox-input {
        width: 1rem;
        height: 1rem;
        cursor: pointer;
        accent-color: #0073ea;
    }

    .checkbox-input:hover {
        transform: scale(1.05);
    }

    /* Responsive adjustments */
    @media (max-width: 639px) {
        .pagination {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }

        .page-info {
            order: -1;
            text-align: center;
            margin-bottom: 0.5rem;
        }

        /* Better button layout on mobile */
        .pagination button {
            flex: 1;
        }
    }
</style>
