export type Shift = {
  _id: string;
  name: string;
  code: "NOON" | "MORN";
  startTime: string;
  endTime: string;
  shiftWindowStart: string;
  shiftWindowEnd: string;
  validFrom: string;
  validTill?: string;
  graceTimeInMinutes: number;


  userId: string;
  shiftId: string;
  shiftCode: "NOON" | "MORN";
  startDate: string;
  isActive: boolean;
  assignedBy: string;
  assignedAt: string;
  createdAt: string;
  updatedAt: string;
};



export type ShiftDetails = {
  _id: string;
  name: string;
  code: string;
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
  graceTimeInMinutes: number;
}

export type IShiftAssignment = {
  _id: string;
  userId: string;
  shiftId: ShiftDetails;
  shiftCode: string;
  startDate: string; // ISO Date string
  endDate?: string; // ISO Date string
  isActive: boolean;
  status: "current" | "upcoming" | "past"; // You can expand this union as needed
  assignedBy: string;
  assignedAt: string; // ISO Date string
  createdAt: string;
  updatedAt: string;
  __v: number;
}