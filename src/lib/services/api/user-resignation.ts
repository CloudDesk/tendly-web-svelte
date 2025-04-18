import type { ApproveResignationData, Resignation, SubmitResignationData, UserResignation } from "$lib/types/userResignation";
import { fetchApi } from "./base";

export const resignationApi = {
    // Submit resignation
    submit: async (userId: string, data: SubmitResignationData): Promise<Resignation> => {
        return fetchApi(`/users-resignations/${userId}/submit`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Withdraw resignation
    withdraw: async (userId: string): Promise<Resignation> => {
        return fetchApi(`/users-resignations/${userId}/withdraw`, {
            method: 'PUT',
        });
    },

    // Get resignation status
    getStatus: async (userId: string): Promise<Resignation | null> => {
        return fetchApi(`/users-resignations/${userId}/status`, {
            method: 'GET',
        });
    },

    // List all users (for managers)
    list: async (): Promise<{ awaiting: UserResignation[]; history: UserResignation[] }> => {
        const response: any = await fetchApi('/users?active=true', { method: 'GET' });
        const users: UserResignation[] = response.data.users;
        return {
            awaiting: users.filter(user => user.resignation?.status === 'Pending').map(user => ({
                ...user,
                employeeName: user.name,
            })),
            history: users.filter(user =>
                user.resignation && ['Approved', 'Rejected', 'Withdrawn'].includes(user.resignation.status)
            ).map(user => ({
                ...user,
                employeeName: user.name,
            })),
        };
    },

    // Approve resignation
    approve: async (userId: string, data: ApproveResignationData): Promise<Resignation> => {
        return fetchApi(`/users-resignations/${userId}/approve`, {
            method: 'PUT',
            body: JSON.stringify(data),
        })
    },

    // Reject resignation
    reject: async (userId: string, remarks?: string): Promise<Resignation> => {
        return fetchApi(`/users-resignations/${userId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ remarks }),
        })
    },

    // Get approved resignations for the current month (for payroll)
    getApprovedForMonth: async (): Promise<UserResignation[]> => {
        const response: any = await fetchApi('/users?active=true', { method: 'GET' });
        const currentMonth = new Date().getMonth();
        return response.data.users
            .filter((user: UserResignation) => {
                if (user.resignation?.status !== 'Approved' || !user.resignation.approvedLastWorkingDay) {
                    return false;
                }
                const lwd = new Date(user.resignation.approvedLastWorkingDay);
                return lwd.getMonth() === currentMonth && lwd.getFullYear() === new Date().getFullYear();
            })
            .map((user: UserResignation) => ({
                ...user,
                employeeName: user.name,
            }));
    },
};