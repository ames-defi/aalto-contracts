import { expect } from "chai";
import { ethers } from "hardhat";
import { MockNFT } from "../../typechain";
import { ITestData } from "../types";
import { aaltoFormatEther, initAaltoContracts } from "../utils/utils";

describe("Transfers", () => {
  let data: ITestData;

  beforeEach(async () => {
    data = await initAaltoContracts(ethers);
  });

  describe("Transfers", () => {
    const transferAmount = ethers.utils.parseEther("100");

    async function giveUserFunds(
      initDistribution: boolean,
      amount = transferAmount
    ) {
      // Trading/transfer can't(shouldn't) be possible by non exempt users until this is set
      if (initDistribution) {
        await data.rebaseSimulator.setDistributionComplete();
      }

      // Transfer from owner to test user
      await data.token.transfer(data.testUserOne.address, amount);
    }

    it("should failed if initial distributon complete has not been set true", async () => {
      // Owner transfers will bypass checks
      await giveUserFunds(false);

      await expect(
        data.token
          .connect(data.testUserOne)
          .transfer(data.testUserTwo.address, transferAmount.div(2))
      ).to.be.revertedWith("AALTO: Trading not started yet");
    });

    it("should allow transfers when initial distributon is complete", async () => {
      await giveUserFunds(true);
      // Shouldn't throw/revert
      await data.token
        .connect(data.testUserOne)
        .transfer(data.testUserTwo.address, transferAmount.div(2));
    });

    it("should revert if sender does not have high enough balance for transfer", async () => {
      // Enable transfer for regular users
      await data.rebaseSimulator.setDistributionComplete();
      // Transfer between two random users
      // Sending user has not been sent any funds yet
      await expect(
        data.token
          .connect(data.testUserOne)
          .transfer(data.testUserTwo.address, transferAmount.div(2))
      ).to.be.revertedWith("AALTO: transfer amount exceeds balance");
    });

    describe("Taking Fees", () => {
      let nft: MockNFT;

      beforeEach(async () => {
        const MockNFT = await ethers.getContractFactory("MockNFT");
        const mocknft = await MockNFT.deploy();

        nft = await mocknft.deployed();
      });

      async function sellToken(
        sellAmount = transferAmount,
        transfer = transferAmount
      ) {
        // Feed the first user to enable later transfers
        await giveUserFunds(true);

        // Transfer between two random users to trigger fee reductions
        await data.token
          .connect(data.testUserOne)
          .transfer(data.testUserTwo.address, transfer);

        let userTwoBalance = await data.token.balanceOf(
          data.testUserTwo.address
        );

        // Need to swap throught the pairs as a buy or sell
        // User two got gifted and is dumping right away to stables
        await data.rebaseSimulator.sellToken(data.testUserTwo, sellAmount);

        userTwoBalance = await data.token.balanceOf(data.testUserTwo.address);
        // Dumper should be emptied out now
        expect(userTwoBalance).to.equal(ethers.constants.Zero);

        // Contract should have taken fees
        const contractBalance = await data.token.contractBalance();
        expect(contractBalance.gt(ethers.constants.Zero)).to.be.true;

        return contractBalance;
      }

      describe("Selling", () => {
        it("should take fees when non exempt user sells token", async () => {
          const contractBalance = await sellToken();
          console.log("contractBalance:" + aaltoFormatEther(contractBalance));
        });

        it("should increase contract balance by totalSellFee when token is sold", async () => {
          const contractBalance = await sellToken();
          const contractBalanceNum = Number(aaltoFormatEther(contractBalance));

          const fees = await data.token.getFees();

          const totalSellFeePercent =
            fees.totalSellFee.toNumber() / fees.feeDenominator.toNumber();

          const sellAmountNumber = Number(aaltoFormatEther(transferAmount));
          // Selling tokens each time. So contract should totalSellFee % of the amount of tokens sold
          // Current sell amount is 100 each time
          expect(sellAmountNumber * totalSellFeePercent).to.equal(
            contractBalanceNum
          );
        });
      });

      describe("Buying", () => {
        it("should take fees when non exempt user buys token", async () => {
          const contractBalanceBefore = await sellToken();

          // User will have stables after the selling of token
          const userStablesBalance = await data.stableCoin.balanceOf(
            data.testUserTwo.address
          );

          const buyAmount = userStablesBalance.div(4);
          await data.rebaseSimulator.buyToken(data.testUserTwo, buyAmount);

          // Contract should have taken fees equal to total buy fees
          // Balance should have increased by transfer amount * totalBuyFee

          const contractBalanceAfter = await data.token.contractBalance();
          const contractBalanceDiff = Number(
            aaltoFormatEther(contractBalanceAfter.sub(contractBalanceBefore))
          );

          // Get amount of token the user received from the pair after fees
          const userTokenBalance = await data.token.balanceOf(
            data.testUserTwo.address
          );
          const userBalanceNum = Number(aaltoFormatEther(userTokenBalance));

          // Set totalBuyFee for math check
          const fees = await data.token.getFees();
          const totalBuyFeePercent =
            fees.totalBuyFee.toNumber() / fees.feeDenominator.toNumber();

          // Need to know how many the user would have received before fees
          // Add amount user received to contract balance increase due to fees taken
          // Sum is the amount of the initial transfer before fees were taken
          const wouldHaveBeenTotal = userBalanceNum + contractBalanceDiff;

          // Taking the buy fee from the initial transfer amount,
          // should give the amount of fees that were deducted from the original transfer
          const feeAmountTaken = wouldHaveBeenTotal * totalBuyFeePercent;

          // The amount of calculated fees taken should equal the increase in the contracts balance
          expect(feeAmountTaken).to.equal(contractBalanceDiff);
        });
      });
    });
  });
});
