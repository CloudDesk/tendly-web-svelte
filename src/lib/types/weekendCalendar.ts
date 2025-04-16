// Interface for each weekend rule
export interface WeekendRule {
    weekday: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    occurrences?: ("1st" | "2nd" | "3rd" | "4th" | "5th")[]; // Optional: For conditional Saturdays
  }
  
  // Main interface for weekend calendar
  export interface IWeekendCalendar {
    _id?: string; // Optional for new records (used when editing existing ones)
    name: string;
    description?: string;
    weekends: WeekendRule[];
    assignedTo?: string[]; // Array of user IDs assigned to this calendar
    createdAt?: string;
    updatedAt?: string;
  }
  