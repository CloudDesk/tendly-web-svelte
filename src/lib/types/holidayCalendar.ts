export type IHolidayCalendar = {
    _id?: string;
    name: string;
    description?: string;
    year: number;
    holidays: IHoliday[];
    assignedTo?: string
}

export interface IHoliday {
    date: Date;
    name: string;
    type: "mandatory" | "optional" | "client-specific";
    description?: string;
}

