import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ApiError } from "./api-error";

const GENERIC_MESSAGE = "Something went wrong. Please try again.";

function isPrismaError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientUnknownRequestError ||
    err instanceof Prisma.PrismaClientRustPanicError ||
    err instanceof Prisma.PrismaClientValidationError ||
    err instanceof Prisma.PrismaClientInitializationError
  );
}

function toErrorResponse(err: unknown, request: Request): NextResponse {
  const label = `${request.method} ${new URL(request.url).pathname}`;

  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (isPrismaError(err)) {
    // Never forward Prisma's raw message to the client — it can contain
    // column/table names (exactly what happened with Match.declineReason).
    console.error(`[api] ${label} — Prisma error:`, err);
    return NextResponse.json({ error: GENERIC_MESSAGE }, { status: 500 });
  }
  if (err instanceof Error) {
    // Existing service convention: plain `new Error(message)` for expected
    // business failures (e.g. "Service request not found"). Mirrors the ad
    // hoc 400 pattern the few already-guarded routes used — zero regression.
    console.error(`[api] ${label}:`, err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  console.error(`[api] ${label} — non-Error thrown:`, err);
  return NextResponse.json({ error: GENERIC_MESSAGE }, { status: 500 });
}

type Handler0 = (request: Request) => Promise<Response>;
type HandlerCtx<Ctx> = (request: Request, context: Ctx) => Promise<Response>;

export function withApiErrorHandling(handler: Handler0): Handler0;
export function withApiErrorHandling<Ctx>(handler: HandlerCtx<Ctx>): HandlerCtx<Ctx>;
export function withApiErrorHandling(
  handler: (request: Request, context?: unknown) => Promise<Response>,
) {
  return async (request: Request, context?: unknown): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (err) {
      return toErrorResponse(err, request);
    }
  };
}
