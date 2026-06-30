import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import type { HardhatUserConfig } from "hardhat/config";

const CHAIN_RPC_URL = process.env.CHAIN_RPC_URL ?? "";
const CHAIN_PRIVATE_KEY = process.env.CHAIN_PRIVATE_KEY ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    // `npx hardhat node` + `--network localhost` — used for dev/test, and by
    // services/blockchain/chain-adapter.ts when CHAIN_NETWORK=HARDHAT_LOCAL.
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Public testnet used for the live, independently-verifiable demo (see
    // docs/ARCHITECTURE.md) — needs CHAIN_RPC_URL (e.g. an Alchemy/Infura
    // Amoy endpoint) and CHAIN_PRIVATE_KEY (a funded testnet wallet) in .env.
    polygonAmoy: {
      url: CHAIN_RPC_URL,
      accounts: CHAIN_PRIVATE_KEY ? [CHAIN_PRIVATE_KEY] : [],
      chainId: 80002,
    },
  },
};

export default config;
