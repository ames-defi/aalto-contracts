import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "ethers";
import {
  ERC20,
  IUniswapV2Factory,
  IUniswapV2Pair,
  IUniswapV2Router02,
  AaltoToken,
} from "../../typechain";
import { ERC20_ABI } from "../abis/ERC20_ABI";
import { UNI_ROUTER_ABI } from "../abis/UniRouterABI";
import { UNISWAPV2_FACTORY_ABI } from "../abis/UniswapV2Factory_ABI";
import { UNIV2_PAIR_ABI } from "../abis/UniV2Pair";
import { ITestData } from "../types";
import { RebaseSimulator } from "./RebaseSimulator";

// Since 0x0 is not permitted
export const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";

export const NATIVE_NONWRAPPED_ADDRESS =
  "0x00000000219ab540356cbb839cbe05303d7705fa";
// Ethereum mainnet WETH address

export const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
// Ethereum mainnet UniswapV2 Router

export const uniRouterAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
// Ethereum mainnet wrapped UST address

export const STABLE_COIN_ADDRESS = "0xa47c8bf37f92aBed4A126BDA807A7b7498661acD";

// Dummy addresses

export const TREASURY_FEE_RECEIVER_ADDRESS =
  "0x2e86D29cFea7c4f422f7fCCF97986bbBa03e1a7F";

export const INSURANCE_FREE_RECEIVER_ADDRESS =
  "0x13f406d1b2671907afabf0fea4f54ba1601ebf3e";
// const NFT_FEE_RECEIVER_ADDRESS =
//   "0x4b9d577caa2eeb61ff63e941972d36852cb659fc";

export const NFT_FEE_RECEIVER_ADDRESS = ethers.constants.AddressZero;

export const STAKING_FREE_RECEIVER_ADDRESS =
  "0x13f406d1b2671907afabf0fea4f54ba1601ebf3e";

export const LP_TOKENS_RECEIVER_ADDRESS = TREASURY_FEE_RECEIVER_ADDRESS;

// 20 minute bump for 15 minute rebase timer
let blockTimeIncrease = 1000 * 60 * 20;

export async function initAaltoContracts(
  ethersTestProvider: any
): Promise<ITestData> {
  let token: AaltoToken;
  let rebaseSimulator: RebaseSimulator;
  let nativePair: IUniswapV2Pair;
  let stablePair: IUniswapV2Pair;
  let stableCoin: ERC20;
  let WETHToken: ERC20;
  let router: IUniswapV2Router02;

  let users: SignerWithAddress[];
  let owner: SignerWithAddress;
  let testUserOne: SignerWithAddress;
  let testUserTwo: SignerWithAddress;
  let testUserThree: SignerWithAddress;
  let testUserFour: SignerWithAddress;

  users = await ethersTestProvider.getSigners();
  owner = users[0];
  testUserOne = users[1];
  testUserTwo = users[2];
  testUserThree = users[3];
  testUserFour = users[4];

  const AaltoToken = await ethersTestProvider.getContractFactory("AaltoToken");
  const aalto = await AaltoToken.deploy(
    uniRouterAddress,
    STABLE_COIN_ADDRESS,
    TREASURY_FEE_RECEIVER_ADDRESS,
    INSURANCE_FREE_RECEIVER_ADDRESS,
    NFT_FEE_RECEIVER_ADDRESS,
    STAKING_FREE_RECEIVER_ADDRESS,
    LP_TOKENS_RECEIVER_ADDRESS,
    ethers.constants.AddressZero // Staking
  );

  token = await aalto.deployed();

  // console.log("Token deployed to: " + token.address);

  nativePair = createUniPair(
    await token.nativeLiquidityPair(),
    ethersTestProvider.provider
  );
  nativePair = nativePair.connect(owner);

  stablePair = createUniPair(
    await token.stableLiquidityPair(),
    ethersTestProvider.provider
  );
  stablePair = stablePair.connect(owner);

  stableCoin = createERC20(
    await token.stableCoinAddress(),
    ethersTestProvider.provider
  );
  stableCoin = stableCoin.connect(owner);

  WETHToken = createERC20(WETH_ADDRESS, ethersTestProvider.provider);
  WETHToken = WETHToken.connect(owner);

  router = createRouter(await token.router(), ethersTestProvider.provider);
  router = router.connect(owner);

  rebaseSimulator = new RebaseSimulator(
    owner,
    WETHToken,
    token,
    router,
    nativePair,
    stablePair,
    stableCoin,
    ethersTestProvider.provider
  );

  await rebaseSimulator.provideInitialLiquidity();

  return {
    owner,
    testUserOne,
    testUserTwo,
    testUserThree,
    testUserFour,
    token,
    nativePair,
    stablePair,
    stableCoin,
    WETHToken,
    router,
    rebaseSimulator,
  };
}

export function createUniPair(
  address: string,
  provider: ethers.providers.JsonRpcProvider
) {
  return new ethers.Contract(
    address,
    UNIV2_PAIR_ABI,
    provider
  ) as IUniswapV2Pair;
}

export function createERC20(
  address: string,
  provider: ethers.providers.JsonRpcProvider
) {
  return new ethers.Contract(address, ERC20_ABI, provider) as ERC20;
}

export function createRouter(
  address: string,
  provider: ethers.providers.JsonRpcProvider
) {
  return new ethers.Contract(
    address,
    UNI_ROUTER_ABI,
    provider
  ) as IUniswapV2Router02;
}

export function createRouterFactory(
  address: string,
  provider: ethers.providers.JsonRpcProvider
) {
  return new ethers.Contract(
    address,
    UNISWAPV2_FACTORY_ABI,
    provider
  ) as IUniswapV2Factory;
}

export async function increaseBlockTime(
  ethersTestProvider: any,
  amountToAddToCurrent: number
) {
  const block = await ethersTestProvider.getBlock(
    await ethersTestProvider.getBlockNumber()
  );
  const newTime = block.timestamp + amountToAddToCurrent;
  // console.log("increaseBlockTime() block.timestamp: " + block.timestamp);
  // console.log("increaseBlockTime() increased to: " + newTime);

  await ethersTestProvider.send("evm_increaseTime", [newTime]);
}

export async function increaseBlockNumber(
  ethersTestProvider: any,
  numberOfBlocks,
  blockTimeInterval // interval between the timestamps of each block, in seconds
) {
  // hardhat_mine is faster than evm_mine for large block count
  // Param need to be a hex string?
  await ethersTestProvider.send("hardhat_mine", [
    numberOfBlocks,
    blockTimeInterval,
  ]);
}

export async function setAccountBalanceETH(
  ethersTestProvider: any,
  account: string,
  hexAmount: string
) {
  await ethersTestProvider.send("hardhat_setBalance", [account, hexAmount]);
}

export async function impersonateAccount(
  ethersTestProvider: any,
  account: string
) {
  await ethersTestProvider.request({
    method: "hardhat_impersonateAccount",
    params: [account],
  });
}

export function aaltoFormatEther(value) {
  return ethers.utils.formatEther(value);
}

export async function deployStaking(ethersTestProvider, aaltoAddress: string) {
  const StakedAaltoToken = await ethersTestProvider.getContractFactory(
    "StakedAaltoToken"
  );
  const staking = await StakedAaltoToken.deploy(aaltoAddress);
  return staking.deployed();
}

export async function triggerRebase(token: AaltoToken, ethersTestProvider) {
  // Increase block time beyond nextRebase check
  await increaseBlockTime(ethersTestProvider, blockTimeIncrease);
  await token.manualRebase();
}
