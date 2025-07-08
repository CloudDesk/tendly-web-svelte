// Returns ["2024-2025", "2023-2024", ...] up to `count` past years
export function getFinancialYears(count = 5): string[] {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
  
    const currentFYStart = currentMonth >= 4 ? currentYear : currentYear - 1;
  
    return Array.from({ length: count }, (_, i) => {
      const from = currentFYStart - i;
      return `${from}-${from + 1}`;
    });
  }
  
  export function getCurrentFinancialYear(): string {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const from = currentMonth >= 4 ? currentYear : currentYear - 1;
    return `${from}-${from + 1}`;
  }
  

  export function validateFY(fy: string): boolean {
    const [from] = fy.split("-").map(Number);
    const [currentFrom] = getCurrentFinancialYear().split("-").map(Number);
  
    if (from > currentFrom) {
      return false;
    }
  
    return true;
  }

  export function isJoiningDateInCurrentFY(joiningDate: Date | string): {
    isValid: boolean;
    financialYear: string | null;
  } {
    console.log(joiningDate,"isJoiningDateInCurrentFY")
    const date = new Date(joiningDate);
    if (isNaN(date.getTime())) {
      return { isValid: false, financialYear: null };
    }
  
    const fy = getCurrentFinancialYear(); // e.g., "2025-2026"
    const [startYear, endYear] = fy.split('-').map(Number);
  
    const fyStart = new Date(`${startYear}-04-01T00:00:00.000Z`);
    const fyEnd = new Date(`${endYear}-03-31T23:59:59.999Z`);
  
    if (date >= fyStart && date <= fyEnd) {
      return { isValid: true, financialYear: fy };
    }
  
    return { isValid: false, financialYear: null };
  }
  