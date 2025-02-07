import { writable, derived } from 'svelte/store';
import type { Writable } from 'svelte/store';
import { attendanceApi } from '$lib/services/api';
import { toUTCDateTime } from '$lib/utils/date';

interface AttendanceRecord {
    shiftDay: string;
    swipes: Array<any>;
    outOfWindowSwipes: Array<{ reason: string }>;
    // Add other relevant fields
}

interface AttendanceState {
    records: AttendanceRecord[];
    isLoading: boolean;
    error: string | null;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    filters: {
        userIds: string[];
        // Add other filter parameters
    };
}

function createAttendanceStore() {
    const initialState: AttendanceState = {
        records: [],
        isLoading: false,
        error: null,
        dateRange: {
            startDate: toUTCDateTime(new Date().toISOString()) || '',
            endDate: toUTCDateTime(new Date().toISOString()) || ''
        },
        filters: {
            userIds: []
        }
    };

    const { subscribe, set, update }: Writable<AttendanceState> = writable(initialState);

    return {
        subscribe,

        // Fetch records with optional date range and filters
        async fetchRecords(params?: Partial<{ startDate: string; endDate: string; userIds: string[] }>) {
            let currentState: AttendanceState = { ...initialState, isLoading: true, error: null };
            update(state => {
                currentState = { ...state, isLoading: true, error: null };
                return currentState;
            });

            try {
                const searchParams = {
                    startDate: params?.startDate || currentState.dateRange.startDate,
                    endDate: params?.endDate || currentState.dateRange.endDate,
                    userIds: params?.userIds || currentState.filters.userIds
                };

                const response = await attendanceApi.search(searchParams);

                update(currentState => ({
                    ...currentState,
                    records: response.data.map((record: any) => ({
                        shiftDay: record.shiftDay,
                        swipes: record.swipes,
                        outOfWindowSwipes: record.outOfWindowSwipes,
                        // Map other relevant fields
                    })),
                    dateRange: {
                        startDate: searchParams.startDate,
                        endDate: searchParams.endDate
                    },
                    filters: {
                        userIds: searchParams.userIds
                    },
                    isLoading: false
                }));
            } catch (error) {
                update(currentState => ({
                    ...currentState,
                    error: (error as Error).message,
                    isLoading: false
                }));
            }
        },

        // Update date range
        setDateRange(startDate: string, endDate: string) {
            update(state => ({
                ...state,
                dateRange: { startDate, endDate }
            }));
        },

        // Update filters
        setFilters(filters: Partial<AttendanceState['filters']>) {
            update(state => ({
                ...state,
                filters: { ...state.filters, ...filters }
            }));
        },

        // Reset store to initial state
        reset() {
            set(initialState);
        }
    };
}

export const attendanceStore = createAttendanceStore();

// Derived stores for specific views
export const todayAttendance = derived(attendanceStore, ($store) => {
    return $store.records.find(record =>
        record.shiftDay.split('T')[0] === new Date().toISOString().split('T')[0]
    );
});