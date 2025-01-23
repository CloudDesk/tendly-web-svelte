import { navigationContext } from '$lib/stores/navigation';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/stores/auth';
import { get } from 'svelte/store';

export const load = async () => {

    const authState = get(auth);
    //  if (!authState.token) {
    if (!authState.user) {
        throw redirect(302, '/login');
    }

    const userRole = authState.user?.role?.toUpperCase();
    if (userRole !== 'ADMIN' && userRole !== 'MANAGER') {
        throw redirect(302, '/');
    }

    navigationContext.set('manager');
}; 