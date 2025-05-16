import { init, register, locale, waitLocale } from 'svelte-i18n';
import { browser } from '$app/environment';

// Register translation files
register('en', () => import('./en.json'));
register('ta', () => import('./ta.json'));

// Initialize i18n
const defaultLocale = 'en';
init({
    fallbackLocale: defaultLocale,
    initialLocale: browser ? localStorage.getItem('language') || defaultLocale : defaultLocale,
});

// Function to change language and persist it
export function setLanguage(lang: string) {
    locale.set(lang);
    if (browser) {
        localStorage.setItem('language', lang);
    }
}

// Export waitLocale for async loading
export { locale, waitLocale };