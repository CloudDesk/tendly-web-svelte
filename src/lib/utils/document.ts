// documents.ts
import { type IDocument } from "$lib/services/api";
export type ActionType =
  | "open"
  | "view"
  | "edit"
  | "delete"
  | "verify"
  | "download";

export interface DocumentAction {
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

export interface Column {
  key: string;
  label: string;
  render?: (doc: IDocument) => string;
}

export function getCertificateActions(
  accessType: "own" | "team" | "global",
  certificateType?: string,
  verificationStatus?: string,
): DocumentAction[] {
  const actions: DocumentAction[] = [];

  if (accessType === "own" && certificateType === "skill") {
    actions.push({
      type: "delete",
      label: "Delete",
      icon: "Trash2",
      variant: "danger",
    });
  }

  if (accessType === "global") {
    actions.push({
      type: "delete",
      label: "Delete",
      icon: "Trash2",
      variant: "danger",
    });

    if (verificationStatus === "Pending") {
      actions.push({
        type: "verify",
        label: "Verify",
        icon: "CheckCircle",
        variant: "success",
        subActions: [
          {
            type: "approve",
            label: "Approve",
            icon: "Check",
            variant: "success",
          },
          {
            type: "reject",
            label: "Reject",
            icon: "X",
            variant: "danger",
          },
        ],
      });
    }
    actions.push({
      type: "edit",
      label: "Edit",
      icon: "Edit",
      variant: "primary",
    });
  }

  return actions;
}

export function getAccessConfig(accessType: "own" | "team" | "global") {
  const base = {
    download: true,
    customActions: [],
  };

  if (accessType === "global") {
    return {
      enabledTabs: ["payslip", "timesheet", "tax", "certificates"],
      showAddSkill: false,
      showAddCertificate: true,
      rowActions: base,
    };
  }

  if (accessType === "team") {
    return {
      enabledTabs: ["timesheet", "certificates"],
      showAddSkill: false,
      rowActions: base,
    };
  }

  return {
    enabledTabs: ["payslip", "timesheet", "tax", "certificates"],
    showAddSkill: true,
    rowActions: base,
  };
}

// New column logic
function getBaseColumns(docType: string): Column[] {
  console.log(docType, "DocType base");
  let base: Column[] = [];
  if (docType === "tax") {
    base = [{ key: "type", label: "Type" }];
  } else if (docType == "certificates") {
    base = [];
  } else {
    base = [{ key: "category", label: "Category" }];
  }

  let specificColumns: Column[] = [];

  switch (docType) {
    case "certificates":
      specificColumns = [
        {
          key: "certificateType",
          label: "Certificate Type",
          render: (doc: IDocument) =>
            doc.metadata?.certificate?.certificateType || "-",
        },
        {
          key: "title",
          label: "Title",
          render: (doc: IDocument) => doc.metadata?.certificate?.title || "-",
        },
        {
          key: "identifier",
          label: "Identifier",
          render: (doc: IDocument) => {
            const cert = doc.metadata?.certificate;
            if (!cert) return "-";
            switch (cert.certificateType) {
              case "IdentityProof":
                return cert.idDetails?.idNumber || "-";
              case "Academic":
                return cert.certificateId || "-";
              case "Experience":
                return cert.experienceDetails?.role || "-";
              case "Skill":
                return cert.skillDetails?.skillName || "-";
              default:
                return "-";
            }
          },
        },
      ];
      break;

    case "payslip":
    case "timesheet":
      specificColumns = [
        {
          key: "monthYear",
          label: "Year-Month",
          render: (doc: IDocument) => {
            if (docType === "payslip" && doc.metadata?.payslip) {
              const { month, year } = doc.metadata.payslip;
              if (month && year)
                return `${year}-${month > 9 ? month : `0${month}`}`;
            }
            if (docType === "timesheet" && doc.metadata?.timesheet) {
              const { month, year } = doc.metadata.timesheet;
              if (month && year)
                return `${year}-${month > 9 ? month : `0${month}`}`;
            }
            return "-";
          },
        },
      ];
      break;

    case "tax":
      specificColumns = [
        { key: "fileName", label: "File Name" },
        {
          key: "financialYear",
          label: "Financial Year",
          render: (doc: IDocument) => {
            if (doc.type === "Form16") {
              return doc.metadata?.form16?.financialYear || "-";
            } else if (doc.type === "Form12B") {
              return doc.metadata?.form12B?.financialYear || "-";
            } else if (doc.type === "Form12BB") {
              return doc.metadata?.form12BB?.financialYear || "-";
            } else {
              return "-";
            }
          },
        },
      ];
      break;

    default:
      specificColumns = [
        { key: "fileName", label: "File Name" },
        {
          key: "uploadDate",
          label: "Upload Date",
          render: (doc: IDocument) =>
            new Date(doc.uploadDate).toLocaleDateString(),
        },
      ];
  }

  return [...base, ...specificColumns];
}

function getAccessColumns(accessType: "own" | "team" | "global"): Column[] {
  const columns: Column[] = [];

  if (accessType === "team" || accessType === "global") {
    // columns.push({ key: "username", label: "Employee" });
  }

  if (accessType === "global") {
    // columns.push({ key: "department", label: "Department" });
  }

  return columns;
}

function getActionColumns(
  docType: string,
  accessType: "own" | "team" | "global",
  rowActions: {
    download?: boolean;
    customActions?: Array<{
      label: string;
      action: string;
      condition?: (doc: IDocument) => boolean;
    }>;
  },
): Column[] {
  const actionColumns: Column[] = [];

  actionColumns.push({
    key: "status",
    label: "Status",
    render: (doc: IDocument) =>
      `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">${doc.status}</span>`,
  });

  actionColumns.push({
    key: "actions",
    label: "Actions",
    render: (doc: IDocument) => {
      let actionsHtml = "";

      if (docType === "certificates") {
        const certificateType = doc.metadata?.certificate?.certificateType;
        const verificationStatus =
          doc.metadata?.certificate?.verificationStatus;
        // console.log(verificationStatus, "verificationStatus");
        const actions = getCertificateActions(
          accessType,
          certificateType,
          verificationStatus,
        );

        const iconMap: Record<string, string> = {
          Eye: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>',
          FileText:
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
          Edit: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>',
          Trash2:
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>',
          CheckCircle:
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>',
          Check:
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',
          X: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>',
          Download:
            '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
        };

        const colorMap: Record<string, string> = {
          primary:
            "text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300 hover:bg-blue-50",
          secondary:
            "text-gray-600 hover:text-gray-800 border-gray-200 hover:border-gray-300 hover:bg-gray-50",
          danger:
            "text-red-600 hover:text-red-800 border-red-200 hover:border-red-300 hover:bg-red-50",
          success:
            "text-green-600 hover:text-green-800 border-green-200 hover:border-green-300 hover:bg-green-50",
        };

        actions.forEach((action) => {
          const colorClass = colorMap[action.variant || "secondary"];
          const icon = iconMap[action.icon] || "";

          if (action.type === "verify") {
            actionsHtml += `
              <div class="relative inline-block mr-2">
                <button
                  onclick="toggleVerifyDropdown('${doc._id}')"
                  class="${colorClass} inline-flex items-center justify-center w-8 h-8 rounded-md border bg-white transition-colors"
                  title="${action.label}"
                >
                  ${icon}
                  <svg class="ml-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
                <div id="verify-dropdown-${doc._id}" class="hidden absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div class="py-1">
                    <button
                      onclick="handleVerifyAction('approve', '${doc._id}')"
                      class="text-green-600 hover:text-green-800 hover:bg-green-50 flex items-center w-full text-left px-3 py-2 text-sm transition-colors"
                    >
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                      Approve
                    </button>
                    <button
                      onclick="handleVerifyAction('reject', '${doc._id}')"
                      class="text-red-600 hover:text-red-800 hover:bg-red-50 flex items-center w-full text-left px-3 py-2 text-sm transition-colors"
                    >
                      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            `;
          } else {
            actionsHtml += `
              <button
                onclick="handleDocumentAction('${action.type}', '${doc._id}')"
                class="${colorClass} inline-flex items-center justify-center w-8 h-8 mr-2 rounded-md border bg-white transition-colors"
                title="${action.label}"
              >
                ${icon}
              </button>
            `;
          }
        });
      }

      if (rowActions.download) {
        if (doc.filePath) {
          actionsHtml += `<a href="${doc.filePath}" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-800 border-blue-200 hover:border-blue-300 hover:bg-blue-50 inline-flex items-center justify-center w-8 h-8 mr-2 rounded-md border bg-white transition-colors" title="Download"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></a>`;
        } else {
          actionsHtml += `<span class="text-gray-400 inline-flex items-center justify-center w-8 h-8 border border-gray-200 rounded-md bg-gray-50" title="No file available"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></span>`;
        }
      }

      if (rowActions.customActions) {
        rowActions.customActions.forEach((action) => {
          if (!action.condition || action.condition(doc)) {
            actionsHtml += `<button class="text-purple-600 hover:text-purple-800 border-purple-200 hover:border-purple-300 hover:bg-purple-50 inline-flex items-center justify-center w-8 h-8 mr-2 rounded-md border bg-white transition-colors" onclick="handleCustomAction('${action.action}', '${doc._id}')" title="${action.label}">•</button>`;
          }
        });
      }

      return actionsHtml;
    },
  });

  return actionColumns;
}

export function getColumns(
  docType: string,
  accessType: "own" | "team" | "global",
  rowActions: {
    download?: boolean;
    customActions?: Array<{
      label: string;
      action: string;
      condition?: (doc: IDocument) => boolean;
    }>;
  },
): Column[] {
  return [
    ...getBaseColumns(docType),
    ...getAccessColumns(accessType),
    ...getActionColumns(docType, accessType, rowActions),
  ];
}
