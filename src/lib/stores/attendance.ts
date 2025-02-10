import { writable } from 'svelte/store';
import { attendanceApi } from '$lib/services/api';
import type { AttendanceRecord } from '$lib/types/attendance';

export const attendanceStore = writable<{
    records: AttendanceRecord[],
    summary: any,
    isLoading: boolean,
    error: any
}>({
    records: [],
    summary: {},
    isLoading: false,
    error: null
});

export async function fetchAttendanceRecords(userIds: string[], startDate: string, endDate: string) {
    attendanceStore.update(state => ({ ...state, isLoading: true, error: null }));
    try {
        const response = await attendanceApi.search({ userIds, startDate, endDate });
        if (response.data.length > 0) {
            const userRecords: AttendanceRecord[] = response.data[0].records.map((record: any) => ({
                _id: record._id,
                shiftId: record.shiftId,
                shiftDay: record.shiftDay,
                shiftStart: record.shiftStart,
                shiftEnd: record.shiftEnd,
                shiftCode: record.shiftCode,
                status: record.status,
                swipes: record.swipes,
                firstIn: record.firstIn,
                lastOut: record.lastOut,
                attendanceStatus: record.attendanceStatus,
                isWithinWindow: record.isWithinWindow,
                isLateEntry: record.isLateEntry,
                isEarlyExit: record.isEarlyExit,
                needsRegularization: record.needsRegularization,
                excessHours: record.excessHours,
                shortfallHours: record.shortfallHours,
                totalWorkHours: record.totalWorkHours,
                breakHours: record.breakHours,
                actualWorkHours: record.actualWorkHours,
                shiftHours: record.shiftHours,
                outOfWindowSwipes: record.outOfWindowSwipes
            }));
            console.log(userRecords, "userRecords");
            attendanceStore.update(state => ({
                ...state,
                records: userRecords,
                summary: response.data[0].summary,
                isLoading: false
            }));
        } else {
            attendanceStore.update(state => ({ ...state, records: [], summary: {}, isLoading: false }));
        }
    } catch (error) {
        attendanceStore.update(state => ({ ...state, error, isLoading: false }));
    }
}

