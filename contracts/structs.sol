// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

// TODO: pack any structs members for storage optimizations as needed once types are settled
struct LockPool {
    bool depositsEnabled;
    uint256 lockTimeSeconds;
    uint256 allocationPoints;
    uint256 amountLocked;
    uint256 lastRewardPaid; // Last time pool distributed rewards
}

/**
 * @dev Record for a user lock deposit
 */
struct UserLockRecord {
    // Restrict to one lock per pool/time lock
    // But user can add to stake amount
    uint256 poolId;
    uint256 startTime;
    uint256 endTime;
    uint256 amountLocked;
    uint256 startBlock;
    uint256 lastTimeRewardClaimed;
    uint256 lastBlockRewardClaimed;
}

/**
 * @dev Interface to track protocol incentivized NFT's
 */
struct ProtocolNft {
    bool active;
    address contractAddress;
    uint256 buyFeeDiscount;
    uint256 sellFeeDiscount;
}
