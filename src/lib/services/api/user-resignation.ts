import type { ApproveResignationData, Resignation, SubmitResignationData, UserResignation } from "$lib/types/userResignation";
import { fetchApi } from "./base";

interface IMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
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
            body: JSON.stringify({}),
        });
    },

    // Get resignation status
    getStatus: async (userId: string): Promise<Resignation | null> => {
        return fetchApi(`/users-resignations/${userId}/status`, {
            method: 'GET',
        });
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

    // get regignation for manager

    manager: async (userId: string, status: string | null, meta: IMeta): Promise<UserResignation> => {
        let url = `/users-resignations/manager/${userId}`;
        const queryParams: string[] = [];
        if (meta.page) {
            queryParams.push(`page=${meta.page}`);
        }
        if (meta.limit) {
            queryParams.push(`limit=${meta.limit}`);
        }
        if (status) {
            queryParams.unshift(`status=${status}`);
        }
        if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
        }
        console.log(url, "url")
        return fetchApi(url, {
            method: 'GET',
        });
    },

    // Get resignation for admin
    admin: async (userId: string, status: string | null, meta: IMeta): Promise<UserResignation> => {
        let url = `/users-resignations/admin/${userId}`;
        const queryParams: string[] = [];
        if (meta.page) {
            queryParams.push(`page=${meta.page}`);
        }
        if (meta.limit) {
            queryParams.push(`limit=${meta.limit}`);
        }
        if (status) {
            queryParams.unshift(`status=${status}`);
        }
        if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
        }
        console.log(url, "url")
        return fetchApi(url, {
            method: 'GET',
        });
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