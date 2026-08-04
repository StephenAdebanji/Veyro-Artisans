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
    // Zod's `.flatten()` shape: { formErrors: string[], fieldErrors: {...} }.
    // Most validation failures (e.g. a single-field `.max()`) land in
    // fieldErrors, not formErrors (that's reserved for object-level
    // `.refine()` checks) — checking formErrors alone silently swallowed the
    // real message and fell through to the generic fallback.
    if (err && typeof err === "object") {
      const shaped = err as { formErrors?: unknown[]; fieldErrors?: Record<string, unknown[]> };
      if (Array.isArray(shaped.formErrors) && typeof shaped.formErrors[0] === "string") {
        return shaped.formErrors[0];
      }
      if (shaped.fieldErrors && typeof shaped.fieldErrors === "object") {
        for (const messages of Object.values(shaped.fieldErrors)) {
          if (Array.isArray(messages) && typeof messages[0] === "string") return messages[0];
        }
      }
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
