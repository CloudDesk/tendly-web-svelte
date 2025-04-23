import { writable } from 'svelte/store';

// Create a writable store for language preference
export const languagePreference = writable('en');

// Function to update language preference
export function setLanguagePreference(language: string) {
  languagePreference.set(language);
  localStorage.setItem('preferredLanguage', language);
}

// Initialize language preference from localStorage if available
if (typeof window !== 'undefined') {
  const storedLanguage = localStorage.getItem('preferredLanguage');
  if (storedLanguage) {
    languagePreference.set(storedLanguage);
  }
} 