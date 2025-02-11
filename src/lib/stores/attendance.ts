// stores/attendance.ts
import { writable, derived } from 'svelte/store';
import { attendanceApi } from '$lib/services/api';
import type { AttendanceRecord } from '$lib/types/attendance';

interface AttendanceState {
    records: AttendanceRecord[];
    summary: any;
    isLoading: boolean;
    error: any;
    currentDate: Date;
    activeFilters: {
        startDate: string;
        endDate: string;
        userIds: string[];
    };
}

const initialState: AttendanceState = {
    records: [],
    summary: {},
    isLoading: false,
    error: null,
    currentDate: new Date(),
    activeFilters: {
        startDate: '',
        endDate: '',
        userIds: []
    }
};

function createAttendanceStore() {
    const { subscribe, set, update } = writable<AttendanceState>(initialState);

    return {
        subscribe,
        setFilters: (filters: Partial<AttendanceState['activeFilters']>) => {
            update(state => ({
                ...state,
                activeFilters: { ...state.activeFilters, ...filters }
            }));
        },
        setCurrentDate: (date: Date) => {
            update(state => ({ ...state, currentDate: date }));
        },
        reset: () => set(initialState),

        // Enhanced fetch function that maintains state
        fetch: async (userIds: string[], startDate: string, endDate: string) => {
            console.log("inside fetch", userIds, startDate, endDate);
            update(state => ({ ...state, isLoading: true, error: null }));
            try {
                const response = await attendanceApi.search({ userIds, startDate, endDate });
                if (response.data.length > 0) {
                    const userRecords: AttendanceRecord[] = response.data[0].records.map((record: any) => ({
                        ...record,
                        // Ensure consistent date format
                        shiftDay: new Date(record.shiftDay).toISOString()
                    }));

                    update(state => ({
                        ...state,
                        records: userRecords,
                        summary: response.data[0].summary,
                        isLoading: false,
                        activeFilters: { userIds, startDate, endDate }
                    }));
                    return userRecords;
                }
                update(state => ({
                    ...state,
                    records: [],
                    summary: {},
                    isLoading: false,
                    activeFilters: { userIds, startDate, endDate }
                }));
                return [];
            } catch (error) {
                update(state => ({ ...state, error, isLoading: false }));
                throw error;
            }
        },

        // New method to update a single record
        updateRecord: async (record: AttendanceRecord) => {
            update(state => ({
                ...state,
                records: state.records.map(r =>
                    r._id === record._id ? record : r
                )
            }));
        },

        // Method to refresh current view
        refreshCurrentView: async () => {
            update(state => ({ ...state, isLoading: true }));
            const { userIds, startDate, endDate } = state.activeFilters;
            await attendanceStore.fetch(userIds, startDate, endDate);
        }
    };
}

export const attendanceStore = createAttendanceStore();

// Derived store for today's record
export const todayRecord = derived(attendanceStore, ($store) => {
    const today = new Date().toISOString().split('T')[0];
    return $store.records.find(record =>
        record.shiftDay.split('T')[0] === today
    );
});