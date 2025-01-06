import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { auth } from "$lib/stores/auth";
import { lovs } from "$lib/stores/lovs";
import { get } from "svelte/store";
import { setCustomFetch } from "$lib/services/api/base";
import { employeesApi } from "$lib/services/api/employees";
export const ssr = false;
export const load = async ({ fetch, url }) => {
  // Set the custom fetch function
  setCustomFetch(fetch);

  if (browser) {
    const authState = get(auth);
    let isAuthenticated = !!authState.token;
    const currentPath = url.pathname;
    const isLoginPage = currentPath === "/login";

    
    if (!isAuthenticated && !isLoginPage) {
      await goto("/login");
    }

    // If authenticated and on login page, redirect based on role
    if (isAuthenticated && isLoginPage) {
      const userRole = authState.user?.roleId?.toUpperCase();
      const redirectPath =
        userRole === "ADMIN"
          ? "/admin/dashboard"
          : userRole === "MANAGER"
          ? "/manager/dashboard"
          : "/my/dashboard";

      await goto(redirectPath);
    }

    // Load LOVs if authenticated
    if (isAuthenticated) {
      await Promise.all([lovs.loadType("UserRole")]);
    }

    return {
      isAuthenticated,
      userRole: authState.user?.roleId?.toUpperCase() || null,
    };
  }

  return {
    isAuthenticated: false,
    userRole: null,
  };
};
