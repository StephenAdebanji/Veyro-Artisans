/** Throw from a route handler when you want explicit control over the HTTP
 * status returned to the client. Existing services keep throwing plain
 * `Error` for now (see api-handler.ts for why that's still honored). */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
