import { goto } from "$app/navigation";
import { employeesApi } from "$lib/services/api/employees";
import { auth } from "$lib/stores/auth";
import { get } from "svelte/store";

export const load = async () => {
  const authState = get(auth);
  const response = await employeesApi.me();
  auth.setUser(response.data, authState.token);
  //await goto("/my/dashboard");  
};
