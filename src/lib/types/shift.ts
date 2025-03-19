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

