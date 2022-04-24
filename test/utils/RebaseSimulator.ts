import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";
import {
  IUniswapV2Pair,
  IUniswapV2Router02,
  AaltoToken,
  ERC20,
  IUniswapV2Factory,
} from "../../typechain";
import {
  aaltoFormatEther,
  createRouterFactory,
  increaseBlockTime,
} from "./utils";

// Since 0x0 is not permitted
const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";

// ETHER mainnet
const NATIVE_NONWRAPPED_ADDRESS = "0x00000000219ab540356cbb839cbe05303d7705fa";

// 20 minute bump for 15 minute rebase timer
let blockTimeIncrease = 1000 * 60 * 20;

export class RebaseSimulator {
  private factory: IUniswapV2Factory;

  constructor(
    public readonly owner: SignerWithAddress,
    public readonly WETH: ERC20,
    public readonly token: AaltoToken,
    public readonly router: IUniswapV2Router02,
    public readonly nativePair: IUniswapV2Pair,
    public readonly stablePair: IUniswapV2Pair,
    public readonly stableCoin: ERC20,
    public readonly ethersTestProvider: any
  ) {}

  // Tokens need to be burned first in most cases to create the effect
  async triggerRebase(burnTokens: boolean) {
    if (burnTokens) {
      await this.burnTokens(20);
    }
    // Increase block time beyond nextRebase check
    await increaseBlockTime(this.ethersTestProvider, blockTimeIncrease);
    await this.token.manualRebase();
  }

  async triggerMultipleRebases(count: number) {
    const runs = new Array(count).fill(1);
    for (const run of runs) {
      await this.triggerRebase(true);
    }
  }

  async setDistributionComplete(complete = true) {
    // Run helper check to help tests avoid cluttering logic
    const status = await this.token.initialDistributionFinished();
    if (status !== complete) {
      await this.token.setInitialDistributionFinished(complete);
    }
  }

  private async setApprovals() {
    await this.token.approve(this.router.address, ethers.constants.MaxUint256);

    await this.WETH.approve(this.router.address, ethers.constants.MaxUint256);

    await this.stableCoin.approve(
      this.router.address,
      ethers.constants.MaxUint256
    );

    await this.stableCoin.approve(
      this.stablePair.address,
      ethers.constants.MaxUint256
    );

    await this.nativePair.approve(
      this.router.address,
      ethers.constants.MaxUint256
    );

    await this.stablePair.approve(
      this.router.address,
      ethers.constants.MaxUint256
    );

    // approve pairs for tokens
    await this.WETH.approve(
      this.nativePair.address,
      ethers.constants.MaxUint256
    );

    await this.token.approve(
      this.nativePair.address,
      ethers.constants.MaxUint256
    );
  }

  async provideInitialLiquidity() {
    try {
      await this.setApprovals();

      // Test env gives 10,000 ETH to start (is configurable)
      const nativeAmountForLP = ethers.BigNumber.from("8000");
      // Wrap native since hardhat test setup gives you native ETHER.
      await this.wrapNative(nativeAmountForLP);

      // Should have 8,000 WETH
      const wethAmountForStable = ethers.BigNumber.from("1");
      // After getting WETH, need to get some stables to create that LP too
      await this.swapWethForStable(wethAmountForStable);

      await this.addStableLP();
      // await this.addNativeLP();
    } catch (error) {
      console.log(error);
      // throw error;
    }
  }

  private async swapWethForStable(wethAmount) {
    try {
      const path = [this.WETH.address, this.stableCoin.address];
      // Could be crazy slippage if native amount is real high
      const amountsOut = await this.router.getAmountsOut(wethAmount, path);
      const stableAmountOut = amountsOut[1];

      // console.log(`
      // stableAmountOut: ${ethers.utils.commify(stableAmountOut.toString())}`);

      await this.router.swapExactTokensForTokens(
        wethAmount,
        0,
        path,
        this.owner.address,
        await this.getBlockDeadLine()
      );
    } catch (error) {
      console.log(error);
    }
  }

  private async addNativeLP() {
    try {
      console.log("- addNativeLP()");

      const wethBalance = await this.WETH.balanceOf(this.owner.address);
      console.log(`wethBalance: ` + wethBalance);

      await this.getOwnerBalance();

      console.log(this.token.address);
      console.log(await this.nativePair.token0());
      console.log(this.WETH.address);
      console.log(await this.nativePair.token1());

      // Needs to be relative to ETH for native
      // Just hard code this against pinned block ETH price for now
      // ETH = $3,081
      const ethAmount = ethers.BigNumber.from("100000000000000000");
      const tokenRelativeToEth = ethers.BigNumber.from(
        "1000000000000000000000"
      ); // $3,081 / 1000 = ~$3.081

      // await this.router.addLiquidity(
      //   this.token.address,
      //   this.WETH.address,
      //   tokenRelativeToEth,
      //   ethAmount,
      //   0,
      //   0,
      //   this.owner.address,
      //   await this.getBlockDeadLine()
      // );

      // await this.router.addLiquidityETH(
      //   this.token.address,
      //   tokenRelativeToEth,
      //   0,
      //   0,
      //   this.owner.address,
      //   await this.getBlockDeadLine()
      // );

      await this.logNativePairInfo();
    } catch (error) {
      console.log(error);
    }
  }

  private async addStableLP() {
    try {
      //console.log("- addStableLP()");

      // const stableBalance = await this.stableCoin.balanceOf(this.owner.address);
      // console.log(`stableBalance: ` + stableBalance);

      // await this.getOwnerBalance();

      // Needs to be relative to one dollar
      // Testing $3 start price. So add 3 tokens for each stable
      const stableAmount = 1000;
      const tokenAmount = stableAmount * 3;

      await this.router.addLiquidity(
        this.token.address,
        this.stableCoin.address,
        tokenAmount,
        stableAmount,
        0,
        0,
        this.owner.address,
        await this.getBlockDeadLine()
      );

      // await this.logStablePairInfo();
    } catch (error) {
      console.log(error);
      // throw error;
    }
  }

  async logStablePairInfo() {
    const stablePairTokenBalance = await this.stablePair.balanceOf(
      this.owner.address
    );
    console.log(stablePairTokenBalance);

    const stablePairReserves = await this.stablePair.getReserves();
    console.log(stablePairReserves);
  }

  async logNativePairInfo() {
    const nativePairTokenBalance = await this.nativePair.balanceOf(
      this.owner.address
    );
    console.log("nativePairTokenBalance: " + nativePairTokenBalance);

    const nativePairReserves = await this.nativePair.getReserves();
    console.log("nativePairReserves: " + nativePairReserves);
  }

  private async wrapNative(nativeAmountForLP) {
    const weth = new ethers.Contract(
      this.WETH.address,
      ["function deposit() public payable"],
      this.ethersTestProvider
    );

    const tx = await weth.connect(this.owner).deposit({
      value: nativeAmountForLP,
    });
    await tx.wait(1);
  }

  private async getBlockDeadLine() {
    const block = await this.ethersTestProvider.getBlock(
      await this.ethersTestProvider.getBlockNumber()
    );

    return block.timestamp + 1000;
  }

  async nativeBalance() {
    try {
      const nativeBalance = await this.ethersTestProvider.send(
        "eth_getBalance",
        [this.owner.address]
      );
      console.log("owner nativeBalance: " + aaltoFormatEther(nativeBalance));
      return nativeBalance;
    } catch (error) {
      throw error;
    }
  }

  async getOwnerBalance() {
    const ownerBalance = await this.token.balanceOf(this.owner.address);
    console.log(`
    owner balance: ${ethers.utils.commify(
      ethers.utils.formatEther(ownerBalance)
    )}`);

    return ownerBalance;
  }

  async getUserBalance(user: string) {
    const userBalance = await this.token.balanceOf(user);
    console.log(`
    user balance: ${ethers.utils.commify(
      ethers.utils.formatEther(userBalance)
    )}`);

    return userBalance;
  }

  // To update supply delta
  async burnTokens(denominator) {
    const ownerBalance = await this.token.balanceOf(this.owner.address);
    await this.token.transfer(DEAD_ADDRESS, ownerBalance.div(denominator));
  }

  async addLiquidity() {
    try {
    } catch (error) {
      throw error;
    }
  }

  async transferBetweenUsers() {
    try {
    } catch (error) {
      throw error;
    }
  }

  // Transfers will fail without router approval for test user
  async approveRouterForUser(user: SignerWithAddress) {
    await this.token
      .connect(user)
      .approve(this.router.address, ethers.constants.MaxUint256);

    await this.token
      .connect(user)
      .approve(this.stablePair.address, ethers.constants.MaxUint256);

    await this.token
      .connect(user)
      .approve(this.nativePair.address, ethers.constants.MaxUint256);

    await this.stableCoin
      .connect(user)
      .approve(this.router.address, ethers.constants.MaxUint256);

    await this.stableCoin
      .connect(user)
      .approve(this.stablePair.address, ethers.constants.MaxUint256);

    await this.stablePair
      .connect(user)
      .approve(this.router.address, ethers.constants.MaxUint256);

    await this.nativePair
      .connect(user)
      .approve(this.router.address, ethers.constants.MaxUint256);

    await this.WETH.connect(user).approve(
      this.router.address,
      ethers.constants.MaxUint256
    );
  }

  async buyToken(user: SignerWithAddress, amountIn: ethers.BigNumber) {
    try {
      await this.approveRouterForUser(user);

      await this.router
        .connect(user)
        .swapExactTokensForTokensSupportingFeeOnTransferTokens(
          amountIn,
          0,
          [this.stableCoin.address, this.token.address],
          user.address,
          await this.getBlockDeadLine()
        );
    } catch (error) {
      throw error;
    }
  }

  async sellToken(user: SignerWithAddress, amount: ethers.BigNumber) {
    try {
      await this.approveRouterForUser(user);
      await this.router
        .connect(user)
        .swapExactTokensForTokensSupportingFeeOnTransferTokens(
          amount,
          0,
          [this.token.address, this.stableCoin.address],
          user.address,
          await this.getBlockDeadLine()
        );
    } catch (error) {
      throw error;
    }
  }

  private async setFactory() {
    if (!this.factory) {
      const factoryAddress = await this.router.factory();
      this.factory = createRouterFactory(
        factoryAddress,
        this.ethersTestProvider
      );
    }
  }

  async getRewardYieldPercent() {
    const rewardYield = await this.token.rewardYield();
    const rewardYieldDenominator = await this.token.rewardYieldDenominator();

    return rewardYield.toNumber() / rewardYieldDenominator.toNumber();
  }

  async getTokenData(withLogs = true) {
    const totalSupply = await this.token.totalSupply();
    const maxSupply = await this.token.maxSupply();
    const circulatingSupply = await this.token.getCirculatingSupply();
    const supplyDelta = await this.token.getSupplyDelta();
    const rewardYield = await this.token.rewardYield();
    const rewardYieldDenominator = await this.token.rewardYieldDenominator();
    const rewardYieldPercent = await this.getRewardYieldPercent();
    const gonSwapThreshold = await this.token.checkSwapThreshold();
    // const rebaseFrequencySeconds = await token.rebaseFrequencySeconds();
    // console.log(`
    // rebaseFrequencySeconds: ${rebaseFrequencySeconds}`);

    // const SECONDS_A_DAY = 1000 * 60 * 60 * 24;

    // const rebaseFrequencyMinutes = rebaseFrequencySeconds.toNumber() / 60;
    // console.log(`
    // rebaseFrequencyMinutes: ${rebaseFrequencyMinutes}`);

    // const rebaseInDay = SECONDS_A_DAY / rebaseFrequencySeconds.toNumber();
    // console.log(`
    // rebaseInDay: ${rebaseInDay}`);

    const gonsPerFragment = await this.token.gonsPerFragment();
    // console.log(`
    //   _gonsPerFragment: ${_gonsPerFragment}`);
    // console.log(`
    //   _gonsPerFragment num digits: ${_gonsPerFragment.toString().length}`);

    // const totalGons = await token.totalGons();
    // console.log(`
    // totalGons: ${totalGons}`)
    // console.log(`
    // totalGons num digits: ${totalGons.toString().length}`)

    // const nextRebase = await token.nextRebase();
    // console.log(`
    // nextRebase: ${nextRebase}`);

    if (withLogs) {
      // console.log(`
      //   totalSupply: ${totalSupply}`);
      // console.log(`
      // totalSupply: ${ethers.utils.commify(
      //   ethers.utils.formatEther(totalSupply)
      // )}`);
      // // console.log(`
      // //   circulatingSupply: ${circulatingSupply}`);
      // console.log(`
      // circulatingSupply: ${ethers.utils.commify(
      //   ethers.utils.formatEther(circulatingSupply)
      // )}`);
      // // console.log(`
      // //   maxSupply: ${maxSupply}`);
      // console.log(`
      //   maxSupply: ${ethers.utils.commify(
      //     ethers.utils.formatEther(maxSupply)
      //   )}`);
      // // console.log(`
      // //   supplyDelta: ${supplyDelta}`);
      // console.log(`
      // supplyDelta: ${ethers.utils.formatEther(supplyDelta)}`);
      // console.log(`
      // rewardYield: ${rewardYield}`);
      // console.log(`
      // rewardYieldDenominator: ${rewardYieldDenominator}`);
      // console.log(`
      // rewardYieldPercent: ${rewardYieldPercent}`);
      // console.log(`
      // (gonSwapThreshold / _gonsPerFrag) formatEther: ${ethers.utils.formatEther(
      //   gonSwapThreshold
      // )}`);
    }

    return {
      totalSupply,
      maxSupply,
      circulatingSupply,
      supplyDelta,
      rewardYield,
      rewardYieldPercent,
      gonSwapThreshold,
      gonsPerFragment,
      rewardYieldDenominator,
    };
  }
}
