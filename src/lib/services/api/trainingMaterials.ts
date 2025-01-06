// Mock data store
let mockMaterials: Record<string, Array<{
    _id: string;
    title: string;
    description: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedBy: {
        _id: string;
        name: string;
    };
    uploadedAt: string;
}>> = {};

// Initialize with some dummy data
const dummyMaterials = [
    {
        _id: '1',
        title: 'Introduction Slides',
        description: 'Course introduction and overview slides',
        fileUrl: 'https://example.com/slides.pdf',
        fileType: 'application/pdf',
        fileSize: 2.5 * 1024 * 1024, // 2.5MB
        uploadedBy: {
            _id: 'user1',
            name: 'John Trainer'
        },
        uploadedAt: '2024-01-15T10:00:00Z'
    },
    {
        _id: '2',
        title: 'Workshop Recording',
        description: 'Recording of the first workshop session',
        fileUrl: 'https://example.com/workshop.mp4',
        fileType: 'video/mp4',
        fileSize: 150 * 1024 * 1024, // 150MB
        uploadedBy: {
            _id: 'user1',
            name: 'John Trainer'
        },
        uploadedAt: '2024-01-16T15:30:00Z'
    },
    {
        _id: '3',
        title: 'Exercise Files',
        description: 'Practice exercises and solutions',
        fileUrl: 'https://example.com/exercises.zip',
        fileType: 'application/zip',
        fileSize: 5 * 1024 * 1024, // 5MB
        uploadedBy: {
            _id: 'user1',
            name: 'John Trainer'
        },
        uploadedAt: '2024-01-17T09:15:00Z'
    }
];

// Helper function to generate ID
const generateId = () => Math.random().toString(36).substr(2, 9);

export const trainingMaterialsApi = {
    getByTraining: async (trainingId: string) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Initialize materials for this training if not exists
        if (!mockMaterials[trainingId]) {
            mockMaterials[trainingId] = [...dummyMaterials];
        }

        return {
            success: true,
            data: mockMaterials[trainingId]
        };
    },

    upload: async (trainingId: string, formData: FormData, onProgress: (progress: number) => void) => {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
            onProgress(progress);
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        const file = formData.get('file') as File;
        const newMaterial = {
            _id: generateId(),
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            fileUrl: URL.createObjectURL(file),
            fileType: file.type,
            fileSize: file.size,
            uploadedBy: {
                _id: 'user1',
                name: 'John Trainer'
            },
            uploadedAt: new Date().toISOString()
        };

        // Initialize materials for this training if not exists
        if (!mockMaterials[trainingId]) {
            mockMaterials[trainingId] = [...dummyMaterials];
        }

        mockMaterials[trainingId].push(newMaterial);

        return {
            success: true,
            data: newMaterial
        };
    },

    delete: async (trainingId: string, materialId: string) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (mockMaterials[trainingId]) {
            mockMaterials[trainingId] = mockMaterials[trainingId].filter(
                m => m._id !== materialId
            );
        }

        return {
            success: true,
            data: null
        };
    }
}; 