import * as dotenv from "dotenv";

const {
  TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD,
} = require("hardhat/builtin-tasks/task-names");
import { HardhatUserConfig, subtask, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import { join } from "path";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

subtask(
  TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD,
  async (args: any, hre, runSuper) => {
    if (args.solcVersion === "0.7.4") {
      const compilerPath = join(__dirname, "soljson-v0.7.4+commit.3f05b770.js");

      return {
        compilerPath,
        isSolcJs: true, // if you are using a native compiler, set this to false
        version: args.solcVersion,
        // this is used as extra information in the build-info files, but other than
        // that is not important
        longVersion: "soljson-v0.7.4+commit.3f05b770",
      };
    }

    // We just use the default subtask if the version is not version we are checking for
    return runSuper();
  }
);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.7.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      forking: {
        url:
          "https://eth-mainnet.alchemyapi.io/v2/" + process.env.ALCHEMY_API_KEY,
        blockNumber: 14461998,
      },
    },
    harmony_mainnet: {
      url: process.env.HARMONY_MAINNET_URL || "",
      accounts:
        process.env.HARMONY_MAINNET_DEV_KEY !== undefined
          ? [process.env.HARMONY_MAINNET_DEV_KEY]
          : [],
    },
    bsc_mainnet: {
      url: process.env.BSC_MAINNET_URL || "",
      accounts:
        process.env.BSC_MAINNET_DEV_KEY !== undefined
          ? [process.env.BSC_MAINNET_DEV_KEY]
          : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
