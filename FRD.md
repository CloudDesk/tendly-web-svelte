
# Techno-Functional Requirements Document (TFRD)
**Project Name**: Next-Gen HRMS  
**Tech Stack**:  
- **Frontend**: Svelte  
- **Backend**: Fastify on AWS Lambda  
- **Database**: MongoDB  
- **Timezone**: IST (Indian Standard Time)

---

## 1. Business Objective
Create a **feature-rich HRMS** system with modules for **employee management**, **shift scheduling**, **attendance tracking**, **biometric integration**, **leave management**, and **payroll processing**. The system will emphasize an **ultra-modern UI** with highly intuitive navigation, seamless workflows, and related info across detail pages.  

---

## 2. Modules Overview
1. **Employee Management**: Manage employee details and visualize hierarchy.  
2. **Shifts and Shift Assignment**: Create and assign shifts with grace periods.  
3. **Attendance and Biometrics**: Track attendance via API swipes with overtime and late check-in policies.  
4. **Leave Management**: Handle leave requests, approvals, and comp-off credits.  
5. **Payroll**: Process payroll based on Indian pay structure with leave and attendance impacts.  

---

## 3. Functional Requirements
### **3.1. Employee Management**
#### Functional Features:
1. **Employee Details**:  
   - Attributes: Name, Employee ID, Role, Department, Email, Joining Date, Manager, and Custom Fields.  

2. **Hierarchy Visualization**:  
   - Interactive org chart with clickable nodes for drill-down.  
   - Show subordinates and reporting chain.

3. **Advanced Employee Detail Page**:  
   - Include tabs:  
     - **Details**: Personal and professional info.  
     - **Leave History**: Approved, pending, and rejected leaves.  
     - **Attendance Logs**: Daily check-ins, late marks, and overtime hours.  
     - **Payroll**: Salary history, deductions, and payouts.  

---

### **Frontend Design**
#### Employee List Page:
- **Table Columns**: Name, Role, Department, Status (Active/Inactive), Actions (Edit/Delete).  
- **Search and Filters**: Search by name, email, or department.  

#### Employee Detail Page:
- **Tabs Navigation**:  
   - **Details Tab**: Employee info.  
   - **Related Data**: Links to view detailed attendance logs or leave approvals.  

#### Org Chart Page:
- Fully interactive org chart with expand/collapse functionality.  

---

### **Backend API Design**
1. **APIs**:
   - **GET /employees**: List employees with filters.  
   - **POST /employees**: Add an employee.  
   - **PUT /employees/{id}**: Update details.  
   - **GET /employees/{id}**: Fetch employee details, including hierarchy.  
   - **GET /org-chart**: Retrieve the hierarchy tree.  

2. **Logic**:
   - Auto-assign manager during creation based on hierarchy.  
   - Cascade updates in hierarchy on manager change.

---

### **Database Schema**
- **Collection**: `employees`  
   ```json
   {
     "_id": "employeeId",
     "name": "John Doe",
     "email": "john.doe@example.com",
     "role": "Manager",
     "department": "HR",
     "status": "Active",
     "managerId": "managerId",
     "hierarchyPath": ["CEO", "Director", "Manager"]
   }
   ```

---

### **3.2. Shifts and Shift Assignment**
#### Functional Features:
1. **Shift Attributes**:  
   - Name, Start Time, End Time, Grace Period, Timezone (default IST).  

2. **Shift Assignment**:  
   - Assign shifts to employees with optional validity dates.  

---

### **Frontend Design**
#### Shift Management Page:
- Create new shifts and assign to employees via a dropdown interface.  
- Filter shifts by department, role, and active status.  

---

### **Backend API Design**
1. **APIs**:  
   - **POST /shifts**: Create shifts.  
   - **GET /shifts**: List shifts.  
   - **POST /shift-assignments**: Assign shifts.  
   - **GET /shift-assignments/{employeeId}**: Fetch shift assignments.  

2. **Logic**:  
   - Auto-detect late swipes based on grace period and IST adjustments.  

---

### **3.3. Attendance and Biometrics**
#### Functional Features:
1. **Attendance Capture**:  
   - Swipes API records timestamps in IST.  
   - Late check-ins flagged for manager approval.  

2. **Overtime Handling**:  
   - Cumulative calculation (8 hours = 1 comp-off leave request).  

---

### **Frontend Design**
#### Attendance Dashboard:
- Heatmap of attendance (color-coded: late, on-time, absent).  
- Filters for specific date ranges and employees.  

#### Approval Dashboard (Manager):
- Late check-in requests and overtime leave credit requests.  

---

### **Backend API Design**
1. **APIs**:  
   - **POST /attendance/swipes**: Record swipe events.  
   - **GET /attendance/{employeeId}**: Fetch attendance logs.  
   - **POST /attendance/approvals**: Approve/reject late marks and comp-offs.  

---

### **Database Schema**
- **Collection**: `attendance`  
   ```json
   {
     "_id": "attendanceId",
     "employeeId": "employeeId",
     "date": "2023-12-29",
     "swipes": [{"timestamp": "2023-12-29T09:05:00", "type": "check-in"}],
     "overtimeHours": 8,
     "lateCount": 2
   }
   ```

---

### **3.4. Leave Management**
#### Functional Features:
1. **Leave Policies**:  
   - Carry-forward policy: Max 10 days per year.  
   - 1 leave deducted for every 2 late marks.  

2. **Leave Types**:  
   - Annual Leave, Sick Leave, Comp-Off, Loss of Pay.  

---

### **Frontend Design**
#### Leave Application Page:
- Dropdown to select leave type and date pickers for the duration.  

---

### **Backend API Design**
1. **APIs**:  
   - **POST /leaves**: Apply for leave.  
   - **GET /leaves/{employeeId}**: Fetch leave requests.  
   - **POST /leaves/approvals**: Manager approval/rejection.  

---

### **3.5. Payroll Processing**
#### Functional Features:
1. **Salary Components**:  
   - Basic Pay, HRA, Special Allowance, PF, ESI, Income Tax.  

2. **Integration with Attendance**:  
   - Adjust salary for late marks, overtime, and loss of pay.  

---

### **Frontend Design**
#### Payroll Dashboard:
- View salary breakdown and deductions.  
- Export payroll reports in Excel/PDF.  

---

### **Backend API Design**
1. **APIs**:  
   - **POST /payroll/calculate**: Calculate payroll for a given month.  
   - **GET /payroll/{employeeId}**: Fetch salary details.  

---

### **Database Schema**
- **Collection**: `payroll`  
   ```json
   {
     "_id": "payrollId",
     "employeeId": "employeeId",
     "month": "2023-12",
     "grossPay": 50000,
     "deductions": 5000,
     "netPay": 45000
   }
   ```

---

## 4. Non-Functional Requirements
1. **Timezone Management**:  
   - All timestamps processed in IST.  
   - API responses include offsets for client adjustments if needed.  

2. **Performance**:  
   - API response time < 200ms for 90% of calls.  

3. **Security**:  
   - Role-based access control.  
   - Enforce HTTPS for all communication.  

---

