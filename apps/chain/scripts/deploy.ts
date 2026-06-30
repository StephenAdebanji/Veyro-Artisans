import { ethers } from "hardhat";

const CONTRACT_NAMES = ["IdentityVerification", "CredentialVerification", "Reputation", "TrustScore"] as const;

async function main() {
  const addresses: Record<string, string> = {};

  for (const name of CONTRACT_NAMES) {
    const Factory = await ethers.getContractFactory(name);
    const contract = await Factory.deploy();
    await contract.waitForDeployment();
    addresses[name] = await contract.getAddress();
    console.log(`${name} deployed to ${addresses[name]}`);
  }

  console.log("\nAdd these to apps/web/.env:");
  console.log(`IDENTITY_CONTRACT_ADDRESS=${addresses.IdentityVerification}`);
  console.log(`CREDENTIAL_CONTRACT_ADDRESS=${addresses.CredentialVerification}`);
  console.log(`REPUTATION_CONTRACT_ADDRESS=${addresses.Reputation}`);
  console.log(`TRUST_SCORE_CONTRACT_ADDRESS=${addresses.TrustScore}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
