import { goto } from "$app/navigation";

export const load = async () => {
    await goto('/my/dashboard');
};