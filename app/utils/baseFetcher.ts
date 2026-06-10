import { isServer } from "@tanstack/react-query";

interface FetchOptions extends RequestInit {}

export async function baseFetcher<T>(
  url: string,
  options?: FetchOptions,
): Promise<T> {
  let finalUrl = `/api${url}`;
  const finalOptions = { ...options };

  if (isServer) {
    const host = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    finalUrl = `${host}/api${url}`;

    const { headers: nextHeaders } = await import("next/headers");
    const reqHeaders = await nextHeaders();

    finalOptions.headers = {
      ...finalOptions.headers,
      cookie: reqHeaders.get("cookie") || "",
    };
  }

  const response = await fetch(finalUrl, {
    ...finalOptions,
    headers: {
      "Content-Type": "application/json",
      ...finalOptions.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
