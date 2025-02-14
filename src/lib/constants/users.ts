
export const userRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'staff', label: 'Staff' }
]

export const userBloodGroups = [
    { "value": "A+", "label": "A+" },
    { "value": "A-", "label": "A-" },
    { "value": "B+", "label": "B+" },
    { "value": "B-", "label": "B-" },
    { "value": "O+", "label": "O+" },
    { "value": "O-", "label": "O-" },
    { "value": "AB+", "label": "AB+" },
    { "value": "AB-", "label": "AB-" }
]

export const userLocations = [
    { "value": "chennai", "label": "Chennai" },
    { "value": "coimbatore", "label": "Coimbatore" },
    { "value": "madurai", "label": "Madurai" },
    { "value": "tiruchirapalli", "label": "Tiruchirapalli" },
    { "value": "trivandrum", "label": "Thiruvananthapuram" },
    { "value": "kochi", "label": "Kochi" },
    { "value": "bangalore", "label": "Bangalore" },
    { "value": "mysore", "label": "Mysore" },
    { "value": "hyderabad", "label": "Hyderabad" },
    { "value": "visakhapatnam", "label": "Visakhapatnam" }
]

export const taxstates = [
    { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
    { value: 'Bihar', label: 'Bihar' },
    { value: 'Gujarat', label: 'Gujarat' },
    { value: 'Maharashtra', label: 'Maharashtra' },
    { value: 'Punjab', label: 'Punjab' },
    { value: 'Rajasthan', label: 'Rajasthan' },
    { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
    { value: 'West Bengal', label: 'West Bengal' },
    { value: 'Tamil Nadu', label: 'Tamil Nadu' },
    { value: 'Karnataka', label: 'Karnataka' },
    { value: 'Telangana', label: 'Telangana' }
]

export const professionalTaxs = [
    {
        "state": "Andhra Pradesh",
        "slabs": [
            {
                "range": {
                    "from": 0,
                    "to": 15000
                },
                "term": "monthly",
                "tax": {
                    "default": 0
                }
            },
            {
                "range": {
                    "from": 15001,
                    "to": 20000
                },
                "term": "monthly",
                "tax": {
                    "default": 150
                }
            },
            {
                "range": {
                    "from": 20001,
                    "to": null
                },
                "term": "monthly",
                "tax": {
                    "default": 200
                }
            }
        ]
    },
    {
        "state": "Bihar",
        "slabs": [
            {
                "range": {
                    "from": 0,
                    "to": 300000
                },
                "term": "yearly",
                "tax": {
                    "default": 0
                }
            },
            {
                "range": {
                    "from": 300001,
                    "to": 500000
                },
                "term": "yearly",
                "tax": {
                    "default": 1000
                }
            },
            {
                "range": {
                    "from": 500001,
                    "to": 1000000
                },
                "term": "yearly",
                "tax": {
                    "default": 2000
                }
            },
            {
                "range": {
                    "from": 1000001,
                    "to": null
                },
                "term": "yearly",
                "tax": {
                    "default": 2500
                }
            }
        ]
    },
    {
        "state": "Gujarat",
        "slabs": [
            {
                "range": {
                    "from": 0,
                    "to": 12000
                },
                "term": "monthly",
                "tax": {
                    "default": 0
                }
            },
            {
                "range": {
                    "from": 12001,
                    "to": null
                },
                "term": "monthly",
                "tax": {
                    "default": 200
                }
            }
        ]
    },
    {
        "state": "Tamil Nadu",
        "slabs": [
            {
                "range": {
                    "from": 3500,
                    "to": 7500
                },
                "term": "monthly",
                "tax": {
                    "default": 0
                }
            },
            {
                "range": {
                    "from": 7501,
                    "to": 12500
                },
                "term": "monthly",
                "tax": {
                    "default": 171
                }
            },
            {
                "range": {
                    "from": 12501,
                    "to": 20000
                },
                "term": "monthly",
                "tax": {
                    "default": 208
                }
            },
            {
                "range": {
                    "from": 20001,
                    "to": 25000
                },
                "term": "monthly",
                "tax": {
                    "default": 317
                }
            },
            {
                "range": {
                    "from": 25001,
                    "to": 30000
                },
                "term": "monthly",
                "tax": {
                    "default": 442
                }
            },
            {
                "range": {
                    "from": 30001,
                    "to": null
                },
                "term": "monthly",
                "tax": {
                    "default": 597
                }
            }
        ]
    },
    {
        "state": "Maharashtra",
        "slabs": [
            {
                "range": {
                    "from": 0,
                    "to": 7500
                },
                "term": "monthly",
                "tax": {
                    "default": 0
                }
            },
            {
                "range": {
                    "from": 7501,
                    "to": 10000
                },
                "term": "monthly",
                "tax": {
                    "default": 175
                }
            },
            {
                "range": {
                    "from": 10001,
                    "to": null
                },
                "term": "monthly",
                "tax": {
                    "default": 200,
                    "lastMonth": 300
                }
            }
        ]
    },
    {
        "state": "Karnataka",
        "slabs": [
            {
                "range": {
                    "from": 0,
                    "to": 25000
                },
                "term": "monthly",
                "tax": {
                    "default": 0
                }
            },
            {
                "range": {
                    "from": 25001,
                    "to": null
                },
                "term": "monthly",
                "tax": {
                    "default": 200
                }
            }
        ]
    },
    {
        "state": "Telangana",
        "slabs": [
            {
                "range": {
                    "from": 0,
                    "to": 15000
                },
                "term": "monthly",
                "tax": {
                    "default": 0
                }
            },
            {
                "range": {
                    "from": 15001,
                    "to": 20000
                },
                "term": "monthly",
                "tax": {
                    "default": 150
                }
            },
            {
                "range": {
                    "from": 20001,
                    "to": null
                },
                "term": "monthly",
                "tax": {
                    "default": 200
                }
            }
        ]
    },
    {
        "state": "Punjab",
        "slabs": [
            {
                "range": {
                    "from": 0,
                    "to": 20882
                },
                "term": "monthly",
                "tax": {
                    "default": 0
                }
            },
            {
                "range": {
                    "from": 20883,
                    "to": null
                },
                "term": "monthly",
                "tax": {
                    "default": 200
                }
            }
        ]
    },
    {
        "state": "Rajasthan",
        "slabs": [
            {
                "range": {
                    "from": 0,
                    "to": 7500
                },
                "term": "monthly",
                "tax": {
                    "default": 0
                }
            },
            {
                "range": {
                    "from": 7501,
                    "to": 10000
                },
                "term": "monthly",
                "tax": {
                    "default": 175
                }
            },
            {
                "range": {
                    "from": 10001,
                    "to": null
                },
                "term": "monthly",
                "tax": {
                    "default": 200,
                    "lastMonth": 300
                }
            }
        ]
    },
    {
        "state": "Uttar Pradesh",
        "slabs": [
            {
                "range": {
                    "from": 0,
                    "to": 7500
                },
                "term": "monthly",
                "tax": {
                    "default": 0
                }
            },
            {
                "range": {
                    "from": 7501,
                    "to": 10000
                },
                "term": "monthly",
                "tax": {
                    "default": 175
                }
            },
            {
                "range": {
                    "from": 10001,
                    "to": null
                },
                "term": "monthly",
                "tax": {
                    "default": 200,
                    "lastMonth": 300
                }
            }
        ]
    },
    {
        "state": "West Bengal",
        "slabs": [
            {
                "range": {
                    "from": 0,
                    "to": 10000
                },
                "term": "monthly",
                "tax": {
                    "default": 0
                }
            },
            {
                "range": {
                    "from": 10001,
                    "to": 15000
                },
                "term": "monthly",
                "tax": {
                    "default": 110
                }
            },
            {
                "range": {
                    "from": 15001,
                    "to": 25000
                },
                "term": "monthly",
                "tax": {
                    "default": 130
                }
            },
            {
                "range": {
                    "from": 25001,
                    "to": 40000
                },
                "term": "monthly",
                "tax": {
                    "default": 150
                }
            },
            {
                "range": {
                    "from": 40001,
                    "to": null
                },
                "term": "monthly",
                "tax": {
                    "default": 200
                }
            }
        ]
    }
]