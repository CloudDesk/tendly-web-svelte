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
  console.log(joiningDate, "isJoiningDateInCurrentFY");
  const date = new Date(joiningDate);
  if (isNaN(date.getTime())) {
    return { isValid: false, financialYear: null };
  }

  const fy = getCurrentFinancialYear(); // e.g., "2025-2026"
  const [startYear, endYear] = fy.split("-").map(Number);

  const fyStart = new Date(`${startYear}-04-01T00:00:00.000Z`);
  const fyEnd = new Date(`${endYear}-03-31T23:59:59.999Z`);

  if (date >= fyStart && date <= fyEnd) {
    return { isValid: true, financialYear: fy };
  }

  return { isValid: false, financialYear: null };
}

/**
 * Get financial year options based on joining date.
 * @param joiningDate ISO string or Date
 * @param futureCount number of future FYs to include (default: 0)
 * @returns string[] list of FYs like ["2024-2025", "2025-2026"]
 */
export function getFYOptionsFromJoiningDate(
  joiningDate: string | Date,
  futureCount = 0,
): string[] {
  const date = new Date(joiningDate);
  if (isNaN(date.getTime())) return [];

  const joinYear = date.getFullYear();
  const joinMonth = date.getMonth() + 1;

  // Determine FY of joining
  const startFY = joinMonth >= 4 ? joinYear : joinYear - 1;

  // Current FY
  const currentFY = (() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    return month >= 4 ? year : year - 1;
  })();

  // We’ll include FYs from joinFY up to currentFY + futureCount
  const endFY = currentFY + futureCount;

  const result: string[] = [];
  for (let fy = startFY; fy <= endFY; fy++) {
    result.push(`${fy}-${fy + 1}`);
  }

  return result;
}
