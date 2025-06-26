export function getAccessConfig(accessType: 'own' | 'team' | 'global') {
    switch (accessType) {
      case 'global':
        return {
          enabledTabs: ['payslip', 'timesheet', 'tax', 'certificates'],
          showAddSkill: false, // Always false for global
          showAddCertificate:true,
          rowActions: {
            preview: true,
            view: true,
            edit: true,
            delete: true,
            verify: true,
            download: true,
            customActions: []
          }
        };
      
      case 'team':
        return {
          enabledTabs: ['timesheet', 'certificates'],
          showAddSkill: false, // Always false for team
          rowActions: {
            preview: true,
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
            preview: true,
            download: true,
            customActions: []
          }
        };
    }
  }