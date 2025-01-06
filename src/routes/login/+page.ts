import { goto } from "$app/navigation";
import { authApi } from "$lib/services/api/auth";
import { employeesApi } from "$lib/services/api/employees";
import { auth } from "$lib/stores/auth";
import { get } from "svelte/store";

export const load = async () => {
  const authState = get(auth);
  return {
    authState,
  }
};
