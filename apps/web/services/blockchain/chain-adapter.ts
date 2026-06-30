import { randomBytes } from "node:crypto";
import { ethers } from "ethers";
import type { BlockchainRecordType } from "@prisma/client";

const RPC_URL = process.env.CHAIN_RPC_URL;
const PRIVATE_KEY = process.env.CHAIN_PRIVATE_KEY;
const NETWORK = (process.env.CHAIN_NETWORK as "HARDHAT_LOCAL" | "POLYGON_AMOY") ?? "HARDHAT_LOCAL";

// All four trust contracts (apps/chain/contracts) share this minimal ABI — one
// write that records an arbitrary JSON payload against a refId, plus the event
// it emits. Keeping one shared ABI shape means this adapter stays generic
// across all four contracts instead of needing bespoke bindings per type.
const TRUST_REGISTRY_ABI = [
  "function recordEvent(bytes32 refId, string payloadJson) returns (bytes32)",
  "event Recorded(bytes32 indexed refId, string payloadJson, uint256 timestamp)",
];

const CONTRACT_ADDRESS_BY_RECORD_TYPE: Record<BlockchainRecordType, string | undefined> = {
  IDENTITY_VERIFIED: process.env.IDENTITY_CONTRACT_ADDRESS,
  CREDENTIAL_VERIFIED: process.env.CREDENTIAL_CONTRACT_ADDRESS,
  TRUST_SCORE_UPDATE: process.env.TRUST_SCORE_CONTRACT_ADDRESS,
  REVIEW_HASH: process.env.REPUTATION_CONTRACT_ADDRESS,
  DISPUTE_RESOLUTION: process.env.REPUTATION_CONTRACT_ADDRESS,
};

export interface ChainWriteResult {
  txHash: string;
  contractAddress: string;
  network: "HARDHAT_LOCAL" | "POLYGON_AMOY";
  blockNumber?: number;
  simulated: boolean;
}

function getSigner(): ethers.Wallet | null {
  if (!RPC_URL || !PRIVATE_KEY) return null;
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Wallet(PRIVATE_KEY, provider);
}

/**
 * Writes one record to its corresponding on-chain trust registry contract.
 * Falls back to a clearly-labeled simulation when chain env vars or a
 * contract address aren't configured yet — acceptable per the brief
 * ("simulated blockchain acceptable for an academic project"). Phase 9
 * deploys the real contracts and fills in these env vars; this function then
 * starts writing for real with no call-site changes anywhere else.
 */
export async function writeTrustRecord(
  recordType: BlockchainRecordType,
  refId: string,
  payload: object,
): Promise<ChainWriteResult> {
  const signer = getSigner();
  const contractAddress = CONTRACT_ADDRESS_BY_RECORD_TYPE[recordType];

  if (!signer || !contractAddress) {
    return {
      txHash: `0xsimulated${randomBytes(28).toString("hex")}`,
      contractAddress: contractAddress ?? "0xsimulated",
      network: NETWORK,
      simulated: true,
    };
  }

  const contract = new ethers.Contract(contractAddress, TRUST_REGISTRY_ABI, signer);
  const refIdBytes = ethers.id(refId);
  const tx = await contract.recordEvent(refIdBytes, JSON.stringify(payload));
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash,
    contractAddress,
    network: NETWORK,
    blockNumber: receipt.blockNumber,
    simulated: false,
  };
}
