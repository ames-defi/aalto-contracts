import { expect } from "chai";
import { ethers } from "hardhat";
import { ITestData } from "../types";
import { initAaltoContracts } from "../utils/utils";

describe("Rebasing", () => {
  let data: ITestData;

  beforeEach(async () => {
    data = await initAaltoContracts(ethers);
  });

  describe("positive rebasing", () => {
    it("should increase holders token amount after rebase", async () => {
      await data.rebaseSimulator.burnTokens(2);
      const ownerBeforeRebase = await data.rebaseSimulator.getOwnerBalance();
      await data.rebaseSimulator.triggerRebase(false);
      const ownerBalanceAfterRebase =
        await data.rebaseSimulator.getOwnerBalance();

      // Should be a positive number = Balanced increased
      const balanceDiff = ownerBalanceAfterRebase.sub(ownerBeforeRebase);
      expect(balanceDiff.gt(0)).to.be.true;
    });
  });
});
