import { navigationContext } from '$lib/stores/navigation';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/stores/auth';
import { get } from 'svelte/store';

export const load = async () => {
    const authState = get(auth);
    console.log('authState', authState);
    if (!authState.user) {
        throw redirect(302, '/login');
    }

    navigationContext.set('staff');
}; 