import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

const CONTRACT_NAMES = ["IdentityVerification", "CredentialVerification", "Reputation", "TrustScore"] as const;

describe("Trust registry contracts", () => {
  for (const name of CONTRACT_NAMES) {
    describe(name, () => {
      it("lets the owner record an event and read it back", async () => {
        const [owner] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory(name);
        const contract = await Factory.deploy();
        await contract.waitForDeployment();

        const refId = ethers.id("artisan-123");
        const payload = JSON.stringify({ artisanId: "artisan-123", status: "VERIFIED" });

        await expect(contract.connect(owner).recordEvent(refId, payload))
          .to.emit(contract, "Recorded")
          .withArgs(refId, payload, anyValue);

        expect(await contract.getRecord(refId)).to.equal(payload);
      });

      it("rejects writes from a non-owner account", async () => {
        const [, stranger] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory(name);
        const contract = await Factory.deploy();
        await contract.waitForDeployment();

        const refId = ethers.id("artisan-456");
        await expect(contract.connect(stranger).recordEvent(refId, "{}")).to.be.reverted;
      });
    });
  }
});
