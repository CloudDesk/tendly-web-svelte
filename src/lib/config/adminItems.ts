import {
    LayoutDashboard,
    Users,
    FileText,
    Settings,
    ClipboardList,
    TrendingUp,
    PieChart,
    FileSpreadsheet
} from 'lucide-svelte';

export const adminItems = [
    // ... existing items ...

    {
        title: "Reports",
        icon: PieChart,
        submenu: [
            {
                title: "Payroll Reports",
                icon: FileSpreadsheet,
                path: "/admin/reports/payroll",
                items: [
                    {
                        title: "Monthly Summary",
                        path: "/admin/reports/payroll/monthly"
                    },
                    {
                        title: "Department Wise",
                        path: "/admin/reports/payroll/department"
                    },
                    {
                        title: "Statutory Reports",
                        path: "/admin/reports/payroll/statutory"
                    }
                ]
            },
            {
                title: "Employee Reports",
                icon: ClipboardList,
                path: "/admin/reports/employee",
                items: [
                    {
                        title: "Headcount Analysis",
                        path: "/admin/reports/employee/headcount"
                    },
                    {
                        title: "Salary Structure",
                        path: "/admin/reports/employee/salary"
                    }
                ]
            },
            {
                title: "Financial Reports",
                icon: TrendingUp,
                path: "/admin/reports/finance",
                items: [
                    {
                        title: "Cost Center Analysis",
                        path: "/admin/reports/finance/cost-center"
                    },
                    {
                        title: "Budget vs Actual",
                        path: "/admin/reports/finance/budget"
                    }
                ]
            }
        ]
    }
]; 