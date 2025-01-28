export type Shift = {
  id: string;
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


