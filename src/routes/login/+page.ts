
import { auth } from "$lib/stores/auth";
import { get } from "svelte/store";

export const load = async () => {
  const authState = get(auth);
  return {
    authState,
  }
};
