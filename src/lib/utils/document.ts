export type ActionType =
  | "preview"
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

export function getCertificateActions(
  accessType: "own" | "team" | "global",
  certificateType?: string,
  verificationStatus?: string,
): DocumentAction[] {
  const actions: DocumentAction[] = [];

  switch (accessType) {
    case "own":
      if (certificateType === "skill") {
        actions.push(
          // {
          //   type: "preview",
          //   label: "Preview",
          //   icon: "Eye",
          //   variant: "secondary",
          // },
          {
            type: "delete",
            label: "Delete",
            icon: "Trash2",
            variant: "danger",
          },
        );
      } else {
        // actions.push({
        //   type: "preview",
        //   label: "Preview",
        //   icon: "Eye",
        //   variant: "secondary",
        // });
      }
      break;

    case "team":
      // actions.push({
      //   type: "preview",
      //   label: "Preview",
      //   icon: "Eye",
      //   variant: "secondary",
      // });
      break;

    case "global":
      // Always show preview first
      // actions.push({
      //   type: "preview",
      //   label: "Preview",
      //   icon: "Eye",
      //   variant: "secondary",
      // });

      // Show verify second (if status is Pending)
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
            { type: "reject", label: "Reject", icon: "X", variant: "danger" },
          ],
        });
      }

      // Always show delete last
      actions.push({
        type: "delete",
        label: "Delete",
        icon: "Trash2",
        variant: "danger",
      });
      break;

    default:
      break;
  }

  return actions;
}

export function getAccessConfig(accessType: "own" | "team" | "global") {
  switch (accessType) {
    case "global":
      return {
        enabledTabs: ["payslip", "timesheet", "tax", "certificates"],
        showAddSkill: false, // Always false for global
        showAddCertificate: true,
        rowActions: {
          preview: false, // Enable preview for payslip in global
          download: true,
          customActions: [],
        },
      };

    case "team":
      return {
        enabledTabs: ["timesheet", "certificates"],
        showAddSkill: false, // Always false for team
        rowActions: {
          preview: false,
          download: true,
          customActions: [],
        },
      };

    case "own":
    default:
      return {
        enabledTabs: ["payslip", "timesheet", "tax", "certificates"],
        showAddSkill: true, // Can be true, but will only show for certificates
        rowActions: {
          preview: false,
          download: true,
          customActions: [],
        },
      };
  }
}
