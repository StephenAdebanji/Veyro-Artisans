export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body) {
    const err = (body as { error: unknown }).error;
    if (typeof err === "string") return err;
    // Zod's `.flatten()` shape: { formErrors: string[], fieldErrors: {...} }
    if (err && typeof err === "object" && Array.isArray((err as { formErrors?: unknown[] }).formErrors)) {
      const [first] = (err as { formErrors: string[] }).formErrors;
      if (first) return first;
    }
  }
  return fallback;
}

/** Drop-in replacement for `fetch()` against VEYRO's own API routes. Never
 * leaves an unhandled rejection: network failures and non-2xx responses both
 * become a typed ApiRequestError you can catch. */
export async function apiFetch<T = unknown>(input: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    throw new ApiRequestError("Network error. Check your connection and try again.", 0);
  }

  const body = await parseJsonSafe(response);

  if (!response.ok) {
    throw new ApiRequestError(extractErrorMessage(body, "Something went wrong. Please try again."), response.status);
  }

  return body as T;
}
