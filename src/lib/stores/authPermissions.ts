import { writable } from 'svelte/store';
import type { UserRole } from '../types';
import { page } from '$app/state';
// Define permission structure
export interface UserPermissions {
    role: UserRole;
    canView: {
        dashboard: boolean;
        leaves: boolean;
        attendance: boolean;
        payslip: boolean;
    };
    canCreate: {
        dashboard: boolean;
        leaves: boolean;
        attendance: boolean;
        payslip: boolean;
    }
    canApprove: {
        leaves: boolean;
        attendance: boolean;
    };
    canEdit: {
        profile: boolean;
    };
}

// Create a store to manage user permissions
function createUserPermissionsStore() {
    const { subscribe, set, update } = writable<UserPermissions>({
        role: 'STAFF',
        canView: {
            dashboard: false,
            leaves: false,
            attendance: false,
            payslip: false
        },
        canCreate: {
            dashboard: false,
            leaves: false,
            attendance: false,
            payslip: false
        }
        ,
        canApprove: {
            leaves: false,
            attendance: false
        },
        canEdit: {
            profile: false
        }
    });

    return {
        subscribe,
        setPermissions: (permissions: UserPermissions) => set(permissions),
        updatePermissions: (updates: Partial<UserPermissions>) => update(current => ({
            ...current,
            ...updates
        }))
    };
}

export const userPermissions = createUserPermissionsStore();

export function setUserPermissions(role: UserRole) {
    switch (role) {
        case 'ADMIN':
            userPermissions.setPermissions({
                role: 'ADMIN',
                canView: {
                    dashboard: true,
                    leaves: true,
                    attendance: true,
                    payslip: true
                },
                canCreate: {
                    dashboard: true,
                    leaves: true,
                    attendance: true,
                    payslip: true
                },
                canApprove: {
                    leaves: true,
                    attendance: true
                },
                canEdit: {
                    profile: true
                }
            });
            break;
        case 'MANAGER':
            userPermissions.setPermissions({
                role: 'MANAGER',
                canView: {
                    dashboard: true,
                    leaves: true,
                    attendance: true,
                    payslip: false
                },
                canCreate: {
                    dashboard: true,
                    leaves: true,
                    attendance: true,
                    payslip: false
                },
                canApprove: {
                    leaves: true,
                    attendance: false
                },
                canEdit: {
                    profile: false
                }
            });
            break;
        case 'STAFF':
            userPermissions.setPermissions({
                role: 'STAFF',
                canView: {
                    dashboard: true,
                    leaves: true,
                    attendance: true,
                    payslip: true
                },
                canCreate: {
                    dashboard: true,
                    leaves: true,
                    attendance: true,
                    payslip: true
                },
                canApprove: {
                    leaves: false,
                    attendance: false
                },
                canEdit: {
                    profile: true
                }
            });
            break;
    }
}

export function getRoleFlags(url: string) {
    // Split the URL into segments and remove empty parts
    const pathSegments = url.split('/').filter(Boolean);

    console.log(url, "URL in getRoleFlags");
    console.log(pathSegments, "Path Segments in getRoleFlags");

    // Get the first segment, which indicates the role
    const role = pathSegments[2]; // Adjust based on your URL structure
    console.log(role, "Role in getRoleFlags");

    // Return an object with flags for each role
    return {
        isAdmin: role === 'admin',
        isManager: role === 'manager',
        isMy: role === 'my'
    };
}
