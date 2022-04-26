// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract ShareSwap is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public shareToken;

    IERC20 public aaltoToken;

    address public treasuryAddress;

    address private constant ZERO_ADDRESS = address(0);

    address private constant BURN_ADDRESS =
        0x000000000000000000000000000000000000dEaD;

    uint256 public aaltoPerShare = 2;

    // Prevent fat finger
    uint256 private constant MAX_AALTO_PER_SHARE = 5;

    // Ability to toggle swap on/off if needed
    bool public swapEnabled = true;

    constructor(
        address _shareToken,
        address _aaltoToken,
        address _treasuryAddress
    ) {
        require(_shareToken != ZERO_ADDRESS, "0x0 _shareToken");
        require(_aaltoToken != ZERO_ADDRESS, "0x0 _aaltoToken");
        require(_treasuryAddress != ZERO_ADDRESS, "0x0 _treasuryAddress");

        shareToken = IERC20(_shareToken);
        aaltoToken = IERC20(_aaltoToken);
        treasuryAddress = _treasuryAddress;
    }

    event ShareSwapped(
        address indexed user,
        uint256 indexed shareAmount,
        uint256 indexed aaltoReceived
    );

    function swap(uint256 _shareAmount) external {
        require(swapEnabled, "Swap not enabled");
        require(_shareAmount > 0, "Zero share amount");
        // Would fail anyway, but an extra check
        require(
            shareToken.balanceOf(msg.sender) >= _shareAmount,
            "User Share balance too low"
        );
        require(
            shareToken.allowance(msg.sender, address(this)) >= _shareAmount,
            "Share Token allowance too low"
        );

        // Make sure we have enough to satify the exchange
        uint256 userAaltoAmount = _shareAmount * aaltoPerShare;
        require(
            aaltoToken.balanceOf(address(this)) >= userAaltoAmount,
            "Contract Aalto balance too low"
        );

        // External calls below to our trusted contracts

        // Bring amount in to contract to do proper accounting
        shareToken.safeTransferFrom(msg.sender, address(this), _shareAmount);

        // Contract share balance should only be more than zero during this transaction
        // Regardless, half is getting burned and half to treasury
        uint256 contractShareBalance = shareToken.balanceOf(address(this));

        // Burn half
        shareToken.safeTransfer(BURN_ADDRESS, contractShareBalance / 2);

        // Send whatever is left over to treasury
        shareToken.safeTransfer(
            treasuryAddress,
            shareToken.balanceOf(address(this))
        );

        // Give caller their aaltoPerShare for _amount
        aaltoToken.safeTransfer(msg.sender, userAaltoAmount);

        emit ShareSwapped(msg.sender, _shareAmount, userAaltoAmount);
    }

    /* ================= ADMIN FUNCTIONS ================= */

    function setSwapEnabled(bool _enabled) external onlyOwner {
        require(swapEnabled != _enabled, "swapEnabled not changed");

        swapEnabled = _enabled;
    }

    function updateAaltoPerShare(uint256 _amount) external onlyOwner {
        require(_amount <= MAX_AALTO_PER_SHARE, "Over MAX_AALTO_PER_SHARE");

        aaltoPerShare = _amount;
    }

    function emergencyWithdraw(address _tokenAddress, uint256 _amount)
        external
        onlyOwner
    {
        require(_tokenAddress != ZERO_ADDRESS, "0x0 _tokenAddress");
        // Would fail anyway, but still
        require(
            IERC20(_tokenAddress).balanceOf(address(this)) >= _amount,
            "Contract balance too low"
        );

        IERC20(_tokenAddress).safeTransfer(owner(), _amount);
    }
}
