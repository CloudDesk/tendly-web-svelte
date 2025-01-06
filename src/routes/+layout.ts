import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import { auth } from "$lib/stores/auth";
import { lovs } from "$lib/stores/lovs";
import { get } from "svelte/store";
import { setCustomFetch } from "$lib/services/api/base";
import { employeesApi } from "$lib/services/api/employees";


export const load = async ({ fetch, url }) => {
  // Set the custom fetch function
  setCustomFetch(fetch);

  // Ensure client-side execution
  if (browser) {
    const authState = get(auth);
    const currentPath = url.pathname;
    const isLoadingPage = currentPath === "/login" || currentPath === "/";
    console.log(currentPath, isLoadingPage);

    // Check authentication state
    let isAuthenticated = !!authState.user;
    console.log(isAuthenticated);
    console.log(authState);
    // Fetch user info if not available but token exists
    if (!authState.user && isAuthenticated) {
      console.log(1.1);
      try {
        console.log(1.2);
        const userInfo = await employeesApi.me();
        console.log(1.3);
        auth.setAuth(userInfo.data);
        console.log(1.4);
        isAuthenticated = true;
      } catch (error) {
        console.error("Error fetching user info:", error);
        isAuthenticated = false;
        auth.setAuth(null);
      }
    }
    console.log(1, isAuthenticated, isLoadingPage);
    // Redirect unauthenticated users to the login page
    if (!isAuthenticated && !isLoadingPage) {
      console.log(2, isAuthenticated, isLoadingPage);
      await goto("/login");
      return { isAuthenticated: false, userRole: null };
    }

    if (isAuthenticated && isLoadingPage) {
      console.log(3, isAuthenticated, isLoadingPage);
      const userRole = authState.user?.roleId?.toUpperCase();
      const redirectPath =
        userRole === "ADMIN"
          ? "/admin/dashboard"
          : userRole === "MANAGER"
          ? "/manager/dashboard"
          : "/my/dashboard";

        console.log(`Redirecting to ${redirectPath}`);
        await goto(redirectPath);
        return { isAuthenticated, userRole };
    }

    return {
      isAuthenticated,
      userRole: authState.user?.roleId?.toUpperCase() || null,
    };
  }

  // Default response for SSR (though SSR is disabled here)
  return {
    isAuthenticated: false,
    userRole: null,
  };
};
