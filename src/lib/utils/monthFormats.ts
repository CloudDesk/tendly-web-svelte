export function getMonthFormats(monthNumber: number): { full: string; short: string; numeric: string } {
    if (monthNumber < 1 || monthNumber > 12) {
        throw new Error("Invalid month number. Please provide a value between 1 and 12.");
    }

    const date = new Date(2025, monthNumber - 1); // Year doesn't matter, only month index

    return {
        full: new Intl.DateTimeFormat("en-US", { month: "long" }).format(date), // January
        short: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date), // Jan
        numeric: monthNumber.toString().padStart(2, "0"), // '01'
    };
}

// // Example Usage
// console.log(getMonthFormats(1));
// // Output: { full: 'January', short: 'Jan', numeric: '01' }
