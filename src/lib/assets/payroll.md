Implementation Manual for Payroll and Payslip

Tech Stack

Frontend: Svelte

Backend: Fastify

Database: Mongoose

Language: TypeScript

Overview

The payroll system allows payroll initiation, approval, payslip generation, and history tracking. In production, payroll execution follows a fixed schedule, whereas in development, it remains open for all days.

Features and Flow

1. Initiate Payroll

Executes for the last month only, between 2nd-4th of the current month (varies based on weekends).

Development Mode: Open for execution on all days.

Production Mode: Execution restricted based on date validation.

Validation: Ensure payroll is executed only once per month.

Status: Initially set to Draft.

Command:

if (env==='production'&&!isWithinPayrollWindow()){throw new Error('Payroll can only be initiated between 2nd-4th of the month.');}

Status: Implemented in Backend ✅

Frontend: Implemented ✅

2. Finance Team Approves and Processes Payments

CEO/Finance team reviews payroll summary:

Total Employees

Total Gross Salary

Total Deductions

Total Net Salary

Exportable Data Format:

UserId,Name,Bank,IFSC,Account No,Net Salary

Status Update:

Approved after review.

Processed after payment initiation.

UI Actions:

Display payroll summary.

Provide Export and Approve options.

Approve action updates all payroll records for the selected month to Approved.

Status: Implemented in Backend ✅

3. Payslip Generation

Executes between 6th-8th of the month.

Fetches payroll data and generates payslip records.

Uses LibreOffice for PDF generation.

Stores generated PDFs in records.

Command:

generatePayslipsForAllEmployees();storePayslipsInDatabase();

4. Send Payslips

Payslips can be sent to:

Selected Employees

All Employees

Command:

sendPayslip(userId);

5. Template Generation

Allows customization of payslip format.

Uses predefined templates with placeholders for dynamic data.

6. History Tracking

Stores past payrolls and payslips for audit and review.

Displays payroll status and processing logs.

7. Charts & Trends

Visualizes payroll data trends.

Includes breakdowns for:

Employee Growth

Payroll Cost Over Time

Deduction Trends