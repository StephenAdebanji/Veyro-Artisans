export async function register() {
  // Guards against Next.js also bundling this for the Edge runtime — the
  // service registry pulls in node:crypto/setImmediate (via Blockchain
  // Service's chain adapter), which the Edge runtime doesn't support and
  // which this app never runs there anyway (every API route here is nodejs).
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerAllEventHandlers } = await import("@/platform/service-registry");
    registerAllEventHandlers();
  }
}
