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