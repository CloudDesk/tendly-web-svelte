<script lang="ts">
    import * as XLSX from 'xlsx';
    
    // Your JSON data (you might want to pass this as a prop or fetch from API)
    const timesheetData = [
        {
            "_id": "67f399ae5eda33d9e5963450",
            "employeeId": "67923605a892ecaccad0ccfc",
            "dateUTC": "2025-04-11T00:00:00.000Z",
            "entries": [
                {
                    "project": "fridday",
                    "task": "friday task-2",
                    "description": "task",
                    "duration": 9,
                    "_id": "67f399ae5eda33d9e5963451"
                }
            ],
            "totalDuration": 9,
            "createdAt": "2025-04-07T09:23:58.265Z",
            "updatedAt": "2025-04-07T09:23:58.265Z",
            "__v": 0
        },
        {
            "_id": "67f399ac5eda33d9e596344c",
            "employeeId": "67923605a892ecaccad0ccfc",
            "dateUTC": "2025-04-10T00:00:00.000Z",
            "entries": [
                {
                    "project": "thursday",
                    "task": "thursday task -1",
                    "description": "task",
                    "duration": 9,
                    "_id": "67f399ac5eda33d9e596344d"
                }
            ],
            "totalDuration": 9,
            "createdAt": "2025-04-07T09:23:56.208Z",
            "updatedAt": "2025-04-07T09:23:56.208Z",
            "__v": 0
        },
        {
            "_id": "67f36e7803742d6eaa100ff2",
            "employeeId": "67923605a892ecaccad0ccfc",
            "dateUTC": "2025-04-08T00:00:00.000Z",
            "entries": [
                {
                    "project": "kumar",
                    "task": "2",
                    "description": "2",
                    "duration": 8,
                    "_id": "67f36e7803742d6eaa100ff3"
                }
            ],
            "totalDuration": 8,
            "createdAt": "2025-04-07T06:19:36.302Z",
            "updatedAt": "2025-04-07T06:19:36.302Z",
            "__v": 0
        },
        {
            "_id": "67f3c9c6b5c9010ee6211d6d",
            "employeeId": "679235d2a892ecaccad0cce3",
            "dateUTC": "2025-04-08T00:00:00.000Z",
            "entries": [
                {
                    "project": "Tendly",
                    "task": "Employee",
                    "description": "UI",
                    "duration": 9,
                    "_id": "67f3c9c6b5c9010ee6211d6e"
                }
            ],
            "totalDuration": 9,
            "createdAt": "2025-04-07T12:49:10.295Z",
            "updatedAt": "2025-04-07T12:49:10.295Z",
            "__v": 0
        },
        {
            "_id": "67f51b1ed4d5f3cc8a1a7d06",
            "employeeId": "679235bfa892ecaccad0ccd5",
            "dateUTC": "2025-04-08T00:00:00.000Z",
            "entries": [
                {
                    "project": "test",
                    "task": "test",
                    "description": "test",
                    "duration": 8,
                    "_id": "67f51b1ed4d5f3cc8a1a7d07"
                }
            ],
            "totalDuration": 8,
            "createdAt": "2025-04-08T12:48:30.905Z",
            "updatedAt": "2025-04-08T12:48:30.905Z",
            "__v": 0
        },
        {
            "_id": "67f3666603742d6eaa100fb4",
            "employeeId": "679235d2a892ecaccad0cce3",
            "dateUTC": "2025-04-07T00:00:00.000Z",
            "entries": [
                {
                    "project": "hrms",
                    "task": "task",
                    "description": "taks",
                    "duration": 8,
                    "_id": "67f3666603742d6eaa100fb5"
                },
                {
                    "project": "valeu",
                    "task": "test",
                    "description": "test",
                    "duration": 1,
                    "_id": "67f3bf34b5c9010ee6211d27"
                }
            ],
            "totalDuration": 9,
            "createdAt": "2025-04-07T05:45:10.751Z",
            "updatedAt": "2025-04-07T12:04:04.528Z",
            "__v": 1
        },
        {
            "_id": "67f36e7603742d6eaa100fee",
            "employeeId": "67923605a892ecaccad0ccfc",
            "dateUTC": "2025-04-07T00:00:00.000Z",
            "entries": [
                {
                    "project": "vinith",
                    "task": "1",
                    "description": "1",
                    "duration": 7,
                    "_id": "67f36e7603742d6eaa100fef"
                },
                {
                    "project": "vinith",
                    "task": "updated",
                    "description": "updated",
                    "duration": 2,
                    "_id": "67f37a760a725481457e302c"
                }
            ],
            "totalDuration": 9,
            "createdAt": "2025-04-07T06:19:34.220Z",
            "updatedAt": "2025-04-07T07:10:46.275Z",
            "__v": 1
        },
        {
            "_id": "67efaef36db9aaeec1949143",
            "dateUTC": "2025-04-01T00:00:00.000Z",
            "employeeId": "676a65b0b06ccef51b302d3d",
            "__v": 2,
            "createdAt": "2025-04-04T10:05:39.051Z",
            "entries": [
                {
                    "project": "HRMS",
                    "task": "Azure",
                    "description": "Updates Azure",
                    "duration": 1,
                    "_id": "67efb316549a0ea3baeb5840"
                },
                {
                    "project": "HRMS",
                    "task": "Login Flow",
                    "description": "worked on the Login flow BE and FE",
                    "duration": 8,
                    "_id": "67f0ea290929beb1fe94904c"
                }
            ],
            "totalDuration": 9,
            "updatedAt": "2025-04-05T08:30:33.777Z"
        }
    ]

    // Interface for the timesheet entry
    interface TimesheetEntry {
        _id: string;
        employeeId: string;
        dateUTC: string;
        entries: {
            project: string;
            task: string;
            description: string;
            duration: number;
            _id: string;
        }[];
        totalDuration: number;
        createdAt: string;
        updatedAt: string;
        __v: number;
    }

    // Function to format date to YYYY-MM-DD
    const formatDate = (dateString: string): string => {
        return new Date(dateString).toISOString().split('T')[0];
    };

    // Function to prepare data for export
    const prepareExportData = () => {
        const exportData: any[] = [];

        timesheetData.forEach((entry: TimesheetEntry) => {
            const formattedDate = formatDate(entry.dateUTC);
            
            entry.entries.forEach((task) => {
                exportData.push({
                    EmployeeID: entry.employeeId,
                    Date: formattedDate,
                    Project: task.project,
                    Description: task.description,
                    'Hours Working': task.duration,
                    'Total Work Hours': entry.totalDuration
                });
            });
        });

        return exportData;
    };

    // Export function
    const exportToExcel = () => {
        const data = prepareExportData();
        
        // Create worksheet
        const worksheet = XLSX.utils.json_to_sheet(data);
        
        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheet');
        
        // Customize column widths (optional)
        worksheet['!cols'] = [
            { wch: 25 }, // EmployeeID
            { wch: 15 }, // Date
            { wch: 20 }, // Project
            { wch: 30 }, // Description
            { wch: 15 }, // Hours Working
            { wch: 15 }  // Total Work Hours
        ];

        // Export the file
        XLSX.writeFile(workbook, `Timesheet_${new Date().toISOString().split('T')[0]}.xlsx`);
    };
</script>

<div>
    <button on:click={exportToExcel}>Download Timesheet</button>
</div>

<style>
    button {
        padding: 10px 20px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
    
    button:hover {
        background-color: #0056b3;
    }
</style>