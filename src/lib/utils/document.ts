export function getAccessConfig(accessType: 'own' | 'team' | 'global') {
    switch (accessType) {
      case 'global':
        return {
          enabledTabs: ['payslip', 'timesheet', 'tax', 'certificates'],
          showAddSkill: false, // Always false for global
          rowActions: {
            preview: false, // Enable preview for payslip in global
            download: true,
            customActions: []
          }
        };
      
      case 'team':
        return {
          enabledTabs: ['timesheet', 'certificates'],
          showAddSkill: false, // Always false for team
          rowActions: {
            preview: false,
            download: true,
            customActions: []
          }
        };
      
      case 'own':
      default:
        return {
          enabledTabs: ['payslip', 'timesheet', 'tax', 'certificates'],
          showAddSkill: true, // Can be true, but will only show for certificates
          rowActions: {
            preview: false,
            download: true,
            customActions: []
          }
        };
    }
  }