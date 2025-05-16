import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { setLanguage, locale } from '$lib/i18n';

function createLanguageStore() {
    const { subscribe, set } = writable<string>(
        browser ? localStorage.getItem('language') || 'en' : 'en'
    );

    return {
        subscribe,
        set: (lang: string) => {
            set(lang);
            setLanguage(lang); // Sync with svelte-i18n
        },
    };
}

export const languageStore = createLanguageStore();

// Sync svelte-i18n's locale with the store
locale.subscribe((lang) => {
    if (lang) {
        languageStore.set(lang);
    }
});