import { browser } from "$app/environment";
import { navigationContext } from "$lib/stores/navigation";
import { get } from "svelte/store";
import type { ApiResponse } from "$lib/types";
import { goto } from "$app/navigation";
import { auth } from "$lib/stores/auth";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
let customFetch = browser ? window.fetch : fetch;

export function setCustomFetch(fn: typeof fetch) {
  customFetch = fn;
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const reqRole = get(navigationContext);
  // Determine if we're sending FormData
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    reqRole: reqRole,
    ...(options.headers || {}),
  };

  // Include credentials to send cookies
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  try {
    const response = await customFetch(
      `${API_BASE_URL}${endpoint}`,
      fetchOptions,
    );
    console.log("response", response);
    // Handle 401 (Unauthorized) - Token expired or invalid
    if (response.status === 401) {
      auth.clearAuth();
      goto("/login");
    }

    // Handle other errors
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "An error occurred" }));
      throw new Error(error.message || "An error occurred");
    }

    return response.json();
  } catch (error) {
    console.log("response", error);
    // Handle network errors or other exceptions
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An error occurred while making the request");
  }
}

export async function uploadFiles(
  endpoint: string,
  formData: FormData,
  method = "POST",
): Promise<any> {
  const reqRole = get(navigationContext);

  try {
    const response = await customFetch(`${API_BASE_URL}${endpoint}`, {
      method: method,
      body: formData,
      credentials: "include",
      headers: {
        // Don't set Content-Type for FormData, browser will set it with boundary
        reqRole: reqRole,
      },
    });

    // Handle 401 (Unauthorized) - Token expired or invalid
    if (response.status === 401) {
      auth.clearAuth();
      goto("/login");
    }

    // Handle other errors
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "An error occurred" }));
      throw new Error(error.message || "An error occurred");
    }

    return response.json();
  } catch (error) {
    console.log("response", error);
    // Handle network errors or other exceptions
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An error occurred while making the request");
  }
}

export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};
