// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

/**
 * @dev We do not need the bloat of the entire OpenZeppelin interface for this.
 */
interface IERC721 {
    /**
     * @dev Returns the number of tokens in ``owner``'s account.
     */
    function balanceOf(address owner) external view returns (uint256 balance);
}
