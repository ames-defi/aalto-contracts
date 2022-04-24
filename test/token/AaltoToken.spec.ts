import { expect } from "chai";
import { ethers } from "hardhat";
import { ITestData } from "../types";
import { initAaltoContracts } from "../utils/utils";

describe("AaltoToken", () => {
  let data: ITestData;

  beforeEach(async () => {
    data = await initAaltoContracts(ethers);
  });

  describe("construction", () => {
    it("should have valid values for all constructornarguments after construction", async () => {
      expect(await data.token.router()).to.not.equal(
        ethers.constants.AddressZero
      );
      expect(await data.token.stableCoinAddress()).to.not.equal(
        ethers.constants.AddressZero
      );
      expect(await data.token.treasuryFeeReceiver()).to.not.equal(
        ethers.constants.AddressZero
      );
    });
    describe("Contract approvals", () => {
      it("should give max allowance to the router for the stable coin", async () => {
        const routerStableAllowance = await data.stableCoin.allowance(
          data.token.address,
          data.router.address
        );
        expect(routerStableAllowance.eq(ethers.constants.MaxUint256)).to.be
          .true;
      });

      it("should give max allowance to the stable coin LP pair for the stable coin", async () => {
        const pairStableAllowance = await data.stableCoin.allowance(
          data.token.address,
          data.stablePair.address
        );
        expect(pairStableAllowance.eq(ethers.constants.MaxUint256)).to.be.true;
      });

      it("should give max allowance to itself for the stable coin", async () => {
        const ownStableAllowance = await data.stableCoin.allowance(
          data.token.address,
          data.token.address
        );
        expect(ownStableAllowance.eq(ethers.constants.MaxUint256)).to.be.true;
      });
    });
  });
});
