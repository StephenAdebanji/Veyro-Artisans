import { NextResponse } from "next/server";
import { blockchainService } from "@/services/blockchain/blockchain.service";

/** Lets the UI show "Anchored on-chain" + a tx hash link for any
 * artisan/credential/review once Blockchain Service's async worker confirms it. */
export async function GET(_request: Request, { params }: { params: Promise<{ refId: string }> }) {
  const { refId } = await params;
  const records = await blockchainService.getRecordsForRef(refId);
  return NextResponse.json({ records });
}
