# Dynamic Certificate Actions Feature

This document describes the enhanced dynamic action system for certificate documents in the Document Hub module.

## Overview

The Document Hub now supports dynamic actions for certificate documents that vary based on:
- **Access Type**: `own`, `team`, `global`
- **Certificate Type**: `skill` or other certificate types

## Action Configuration

### Access Type: `own`
- **Skill Certificates**: Preview, Delete
- **Other Certificates**: Preview only

### Access Type: `team`
- **All Certificates**: Preview only

### Access Type: `global`
- **Pending Certificates**: Preview, Verify (Approve/Reject), Delete
- **Non-Pending Certificates**: Preview, Delete

## Implementation Details

### Core Files Modified

1. **`src/lib/utils/document.ts`**
   - Added `getCertificateActions()` function
   - Added TypeScript interfaces for actions
   - Enhanced `getAccessConfig()` function

2. **`src/lib/components/documentCenter/DocumentViewer.svelte`**
   - Updated `getActionColumns()` to use dynamic actions
   - Added Lucide SVG icons for all actions
   - Implemented dropdown for verify actions
   - Enhanced styling with proper button variants

3. **`src/routes/my/document-hub/+page.svelte`**
   - Added event handlers for new action types
   - Implemented `handleDocumentAction()` and `handleVerifyAction()`

4. **`src/lib/components/employee/EmployeeDocument.svelte`**
   - Added same action handlers for employee document views

### Action Types

#### Primary Actions
- **Preview** (👁️): View document preview
- **Delete** (🗑️): Delete document with confirmation
- **Download** (⬇️): Download/open document file

#### Verification Actions (Global access only)
- **Verify** (📝): Toggle dropdown with Approve/Reject options
  - **Approve** (✓): Approve certificate with confirmation dialog
  - **Reject** (✗): Reject certificate with confirmation dialog

### Button Styling

All action buttons use consistent styling:
- Rounded borders with hover effects
- Color-coded by action type (primary, secondary, danger, success)
- Proper spacing and transitions
- SVG icons from Heroicons (inline)
- Toggle dropdown for verify action with outside-click-to-close functionality

## Usage Examples

### Basic Usage
```svelte
<DocumentViewer
  accessType="global"
  enabledTabs={['certificates']}
  showAddSkill={false}
  on:documentAction={handleDocumentAction}
  on:verifyAction={handleVerifyAction}
/>
```

### Event Handlers
```javascript
function handleDocumentAction(event) {
  const { action, docId, documentType } = event.detail;
  
  switch (action) {
    case 'preview':
      // Handle preview
      break;
    case 'delete':
      // Handle delete - no confirmation needed here as it's handled by the component
      await deleteDocument(docId);
      break;
  }
}

async function handleVerifyAction(event) {
  const { action, docId, documentType } = event.detail;
  
  try {
    switch (action) {
      case 'approve':
        // Handle approval - confirmation dialog already shown
        await approveCertificate(docId);
        break;
      case 'reject':
        // Handle rejection - confirmation dialog already shown
        await rejectCertificate(docId);
        break;
    }
  } catch (error) {
    console.error('Verify action failed:', error);
  }
}
```

## Configuration Function

### `getCertificateActions(accessType, certificateType, verificationStatus)`

Returns an array of `DocumentAction` objects based on access type, certificate type, and verification status.

```typescript
interface DocumentAction {
  type: ActionType;
  label: string;
  icon: string;
  variant?: "primary" | "secondary" | "danger" | "success";
  subActions?: {
    type: string;
    label: string;
    icon: string;
    variant?: "primary" | "secondary" | "danger" | "success";
  }[];
}
```

## Events Dispatched

### `documentAction`
Dispatched for primary actions (preview, view, edit, delete)
```javascript
{
  action: string,    // Action type
  docId: string,     // Document ID
  documentType: string // Document type ('certificates')
}
```

### `verifyAction`
Dispatched for verification actions (approve, reject)
```javascript
{
  action: string,    // 'approve' or 'reject'
  docId: string,     // Document ID
  documentType: string // Document type ('certificates')
}
```

## Global Functions

The following functions are made available globally for HTML onclick handlers:
- `handleDocumentAction(actionType, docId)`
- `handleVerifyAction(verifyType, docId)`
- `toggleVerifyDropdown(docId)` - Toggles verify dropdown and closes others

## Security Considerations

1. **Access Control**: Actions are filtered based on user access level and certificate status
2. **Confirmation Dialogs**: All destructive actions use ConfirmDialog component
3. **Server Validation**: All actions should be validated server-side
4. **Audit Trail**: Consider logging all verification and modification actions
5. **Status-Based Access**: Verify actions only appear for pending certificates

## Testing

To test the dynamic actions:

1. **Own Access + Skill Certificate**: Should show preview and delete
2. **Own Access + Other Certificate**: Should show only preview
3. **Team Access**: Should show only preview for all certificates
4. **Global Access + Pending Certificate**: Should show preview, verify (dropdown), and delete
5. **Global Access + Non-Pending Certificate**: Should show preview and delete (no verify)

## Future Enhancements

1. **Bulk Actions**: Enable multiple document selection
2. **Custom Actions**: Allow plugins to register custom actions
3. **Keyboard Shortcuts**: Add keyboard navigation for actions
4. **Action Permissions**: Granular permissions per action type
5. **Status Transitions**: Add more status-based action flows
6. **Audit Logging**: Track all action history with timestamps

## Browser Compatibility

- Modern browsers with ES6+ support
- CSS Grid and Flexbox support required
- SVG support required for icons