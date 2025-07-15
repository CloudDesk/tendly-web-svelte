# Checkbox Table Usage Example

This guide demonstrates how to use the checkbox column type in the common Table component to control the `metadata.form12BB.isPreviewEnabled` property for Form12BB documents.

## Basic Setup

### 1. Column Configuration

```typescript
const columns = [
    // Regular columns
    {
        key: "employeeId",
        label: "Employee ID",
        sortable: true,
    },
    {
        key: "fileName",
        label: "File Name",
        sortable: true,
    },
    // Checkbox column for isPreviewEnabled
    {
        key: "metadata.form12BB.isPreviewEnabled",
        label: "Preview Enabled",
        type: "checkbox",  // This enables checkbox functionality
        sortable: false,
    },
    // Other columns...
];
```

### 2. Data Structure

Ensure your data has the nested property accessible:

```typescript
const documents = [
    {
        _id: "doc1",
        employeeId: "EMP001",
        fileName: "form12bb_2024.pdf",
        metadata: {
            form12BB: {
                isPreviewEnabled: true,
                financialYear: "2024-25",
                // ... other form12BB properties
            }
        },
        // ... other document properties
    },
    // ... more documents
];
```

### 3. Event Handling

```typescript
async function handleCheckboxChange(event: CustomEvent) {
    const { action, id, checked, item } = event.detail;

    if (action === "toggle_metadata.form12BB.isPreviewEnabled") {
        try {
            // Update via API
            const response = await documentsApi.updateForm12BBPreview(id, checked);

            if (response.success) {
                // Update local state
                documents = documents.map(doc => {
                    if (doc._id === id) {
                        return {
                            ...doc,
                            metadata: {
                                ...doc.metadata,
                                form12BB: {
                                    ...doc.metadata?.form12BB,
                                    isPreviewEnabled: checked,
                                },
                            },
                        };
                    }
                    return doc;
                });

                showNotification(`Preview ${checked ? 'enabled' : 'disabled'} successfully`);
            } else {
                showNotification("Failed to update preview status", "error");
            }
        } catch (error) {
            console.error("Error updating preview status:", error);
            showNotification("Network error occurred", "error");
        }
    }
}
```

### 4. Table Component Usage

```svelte
<Table
    data={documents}
    {columns}
    {loading}
    {error}
    {meta}
    searchable={true}
    serverSide={false}
    variant="contained"
    on:checkboxChange={handleCheckboxChange}
    on:action={handleTableAction}
    on:rowClick={handleRowClick}
/>
```

## API Integration

### Required API Method

Add this method to your documents API:

```typescript
updateForm12BBPreview: async (
    id: string,
    isPreviewEnabled: boolean,
): Promise<DocumentResponse> => {
    return await fetchApi(`/documents/${id}/preview-status`, {
        method: "PATCH",
        body: JSON.stringify({ isPreviewEnabled }),
    });
},
```

### Backend Endpoint

The backend should handle:
- `PATCH /documents/:id/preview-status`
- Request body: `{ isPreviewEnabled: boolean }`
- Response: Updated document or success status

## Advanced Features

### Bulk Operations

```typescript
async function handleBulkPreviewToggle(enable: boolean) {
    const selectedIds = getSelectedDocumentIds();
    
    try {
        const results = await Promise.allSettled(
            selectedIds.map(id => documentsApi.updateForm12BBPreview(id, enable))
        );

        const successes = results.filter(r => r.status === 'fulfilled').length;
        showNotification(`Preview ${enable ? 'enabled' : 'disabled'} for ${successes} documents`);
        
        // Refresh data
        await loadDocuments();
    } catch (error) {
        showNotification("Bulk update failed", "error");
    }
}
```

### Permission-based Display

```typescript
const columns = [
    // ... other columns
    {
        key: "metadata.form12BB.isPreviewEnabled",
        label: "Preview Enabled",
        type: "checkbox",
        sortable: false,
        // Only show checkbox for admins
        render: (item: IDocument) => {
            if (!userHasPermission('admin')) {
                return item.metadata?.form12BB?.isPreviewEnabled ? 'Yes' : 'No';
            }
            // Return undefined to use default checkbox rendering
            return undefined;
        },
    },
];
```

## Event Details

The `checkboxChange` event provides:

```typescript
{
    action: string;        // "toggle_" + column.key
    id: string;           // item._id or item.id
    checked: boolean;     // new checkbox state
    item: any;           // the full data item
}
```

## Best Practices

1. **Always handle API errors** and revert UI state if needed
2. **Show loading states** during API calls
3. **Provide user feedback** with notifications/toasts
4. **Use optimistic updates** for better UX
5. **Validate permissions** before allowing changes
6. **Debounce rapid changes** if needed

## Styling

The checkbox uses the default browser styling with some enhancements:

```css
.checkbox-input {
    width: 1.2rem;
    height: 1.2rem;
    cursor: pointer;
    accent-color: #0073ea;
}

.checkbox-input:focus {
    outline: 2px solid #0073ea;
    outline-offset: 2px;
}
```

## Mobile Support

The checkbox works seamlessly in mobile card view, displaying within the card layout alongside other fields.

## Accessibility

- Checkboxes are properly labeled
- Focus states are clearly visible
- Screen readers can identify the checkbox purpose
- Keyboard navigation is supported

## Error Handling

```typescript
try {
    const response = await documentsApi.updateForm12BBPreview(id, checked);
    if (!response.success) {
        throw new Error(response.error);
    }
    // Success handling...
} catch (error) {
    // Revert checkbox state
    const checkbox = event.target as HTMLInputElement;
    checkbox.checked = !checked;
    
    // Show error message
    showNotification("Failed to update preview status", "error");
}
```
