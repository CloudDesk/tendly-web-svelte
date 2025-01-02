import { writable } from 'svelte/store';

type NavigationContext = 'admin' | 'manager' | 'staff';

const navigationContext = writable<NavigationContext>('staff');

export { navigationContext };
export type { NavigationContext }; 