import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  ERC20,
  IUniswapV2Pair,
  IUniswapV2Router02,
  AaltoToken,
} from "../typechain";
import { RebaseSimulator } from "./utils/RebaseSimulator";

export interface ITestData {
  router: IUniswapV2Router02;
  owner: SignerWithAddress;
  testUserOne: SignerWithAddress;
  testUserTwo: SignerWithAddress;
  testUserThree: SignerWithAddress;
  testUserFour: SignerWithAddress;
  token: AaltoToken;
  nativePair: IUniswapV2Pair;
  stablePair: IUniswapV2Pair;
  stableCoin: ERC20;
  WETHToken: ERC20;
  rebaseSimulator: RebaseSimulator;
}
