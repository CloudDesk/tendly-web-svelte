import { writable } from "svelte/store";

export function persistentWritable<T>(key: string, initialValue: T) {
  const storedValue = localStorage.getItem(key);
  const store = writable<T>(storedValue ? JSON.parse(storedValue) : initialValue);

  store.subscribe((value) => {
    localStorage.setItem(key, JSON.stringify(value));
  });

  return store;
}
