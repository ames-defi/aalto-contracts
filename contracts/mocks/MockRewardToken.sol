// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockRewardToken is ERC20 {
    constructor(uint256 _initialOwnerBalance)
        ERC20("MockRewardToken", "MockRewardToken")
    {
        _mint(msg.sender, _initialOwnerBalance);
    }
}
