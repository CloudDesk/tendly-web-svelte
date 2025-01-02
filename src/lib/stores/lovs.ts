import { writable } from 'svelte/store';
import { lovsApi } from '$lib/services/api';
import type { LOVValue } from '$lib/services/api/lovs';

type LOVStore = {
    [key: string]: LOVValue[];
};

function createLOVStore() {
    const { subscribe, set, update } = writable<LOVStore>({});

    return {
        subscribe,
        loadType: async (type: string) => {
            try {
                const response = await lovsApi.getByType(type);
                const values = response.data.values.filter(v => v.isActive);
                update(store => ({
                    ...store,
                    [type]: values
                }));
                return values;
            } catch (error) {
                console.error('Failed to load LOV:', type, error);
                return [];
            }
        },
        clear: () => set({})
    };
}

export const lovs = createLOVStore(); 