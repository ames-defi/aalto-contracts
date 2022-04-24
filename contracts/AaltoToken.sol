// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity 0.7.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Factory.sol";
import "./interfaces/IStaking.sol";
import "./interfaces/IERC721.sol";
import "./interfaces/IAaltoToken.sol";

import "./libs/SafeMathInt.sol";
import "./ERC20Detailed.sol";
import "./ProtocolFees.sol";
import "./structs.sol";

/// @title Rebasing token contract.
/// @author 0xBriz
/// @notice Modified flow of what started with Titano and expanded on by Safuu, Libero, etc.
contract AaltoToken is
    ERC20Detailed,
    ProtocolFees,
    ReentrancyGuard,
    IAaltoToken
{
    using SafeMath for uint256;
    using SafeMathInt for int256;

    bool public initialDistributionFinished = false;

    uint256 private constant MAX_UINT256 = ~uint256(0);

    /* ================== TOKEN INFO =================== */

    uint256 private constant DECIMALS = 18;

    uint256 private constant INITIAL_FRAGMENTS_SUPPLY = 550000 * 10**DECIMALS; // 550,000

    uint256 private constant MAX_SUPPLY = 55 * 10**8 * 10**DECIMALS; // 5,550,000,000

    // TOTAL_GONS is a multiple of INITIAL_FRAGMENTS_SUPPLY so that _gonsPerFragment is an integer.
    // Use the highest value that fits in a uint256 for max granularity.
    uint256 private constant TOTAL_GONS =
        MAX_UINT256 - (MAX_UINT256 % INITIAL_FRAGMENTS_SUPPLY);

    // underscore to avoid clashing with base class
    uint256 private _totalSupply;

    // The divisor or multiplier used for math operations.
    // Is set during each rebase as needed (= TOTAL_GONS / totalSupply)
    uint256 private _gonsPerFragment;

    // The threshold used to determine when we should be swapping the
    // current contract balance to native/stable. See `shouldSwapBack`.
    // Can be reset by admin in `setSwapBackSettings`.
    uint256 private gonSwapThreshold = (TOTAL_GONS * 10) / 10000;

    mapping(address => uint256) private _gonBalances;

    mapping(address => uint256) private _lockedBalances;

    // Mapping of contract approvals
    mapping(address => mapping(address => uint256)) private _allowedFragments;

    /* =================== BURN ADDRESSES =================== */

    address constant DEAD = 0x000000000000000000000000000000000000dEaD;

    address constant ZERO = 0x0000000000000000000000000000000000000000;

    /* ============== REBASE/LP ITEMS =============== */

    uint256 private constant MAX_REBASE_FREQUENCY = 1800;

    // Adds on to block timestamp during rebase to set `nextRebase` time.
    // nextRebase = block.timestamp + rebaseFrequency
    uint256 public rebaseFrequencySeconds = 900;

    uint256 public nextRebase = block.timestamp + 31536000;

    // 0.0239% per 15 minute rebase cycle
    uint256 public rewardYield = 239;
    uint256 public rewardYieldDenominator = 1000000;

    bool public autoRebase = true;

    // Cap on amount one sell transfer can be
    // Able to be updated by admin. Initial 10,000
    uint256 public maxSellTransactionAmount = 10000 * 10**18;

    // Used to determine whether current liquidity is over/under a target threshold
    uint256 public targetLiquidity = 50;
    uint256 public targetLiquidityDenominator = 100;

    // Determines whether swap backs are to native or stable
    bool public isLiquidityInNative = false;

    bool public swapEnabled = true;

    /* ================ CORE CONTRACTS ================ */

    // Array of the core(native/stable) pairs
    address[] public corePairs;

    // Mapping of the `corePairs` to simplify checks and reduce duplication
    mapping(address => bool) public isCorePair;

    // Native LP pairing for this token
    IUniswapV2Pair public immutable nativeLiquidityPair;

    // Stable coin based pairing for this token
    IUniswapV2Pair public immutable stableLiquidityPair;

    address public immutable stableCoinAddress;

    // Address of NFT contract that provides incentives/benefits for owners
    address public nftContractAddress;

    // DEX router used for swaps and liquidity
    IUniswapV2Router02 public router;

    // The staking token contract -> Deep Blue Bank
    IStaking public staking;

    bool public stakingEnabled = false;

    constructor(
        address _routerAddress,
        address _stableCoinAddress,
        address _treasuryFeeReceiver,
        address _insuranceFeeReceiver,
        address _nftFeeReceiver,
        address _stakingFeeReceiver,
        address _liquityTokensReceiver,
        address _stakingContractAddress
    )
        ERC20Detailed("Aalto Protocol", "AALTO", uint8(DECIMALS))
        ProtocolFees(
            _treasuryFeeReceiver,
            _insuranceFeeReceiver,
            _nftFeeReceiver,
            _stakingFeeReceiver,
            _liquityTokensReceiver
        )
    {
        require(_routerAddress != address(0), "AALTO: 0x0 _routerAddress");
        require(
            _stableCoinAddress != address(0),
            "AALTO: 0x0 _stableCoinAddress"
        );

        // Staking currently possible zero address
        if (_stakingContractAddress != address(0)) {
            staking = IStaking(_stakingContractAddress);
            stakingEnabled = true;
            isFeeExempt[_stakingContractAddress] = true;
        }

        router = IUniswapV2Router02(_routerAddress);

        // Create core native pairing
        address _nativeLiquidityPairAddress = IUniswapV2Factory(
            router.factory()
        ).createPair(address(this), router.WETH());

        nativeLiquidityPair = IUniswapV2Pair(_nativeLiquidityPairAddress);

        // Create stable pair
        address _stableLiquidityPairAddress = IUniswapV2Factory(
            router.factory()
        ).createPair(address(this), _stableCoinAddress);

        stableCoinAddress = _stableCoinAddress;
        stableLiquidityPair = IUniswapV2Pair(_stableLiquidityPairAddress);

        // Set the two new pairs used as reference for liquidity backing
        setAutomatedMarketMakerPair(_nativeLiquidityPairAddress, true);
        setAutomatedMarketMakerPair(_stableLiquidityPairAddress, true);

        _totalSupply = INITIAL_FRAGMENTS_SUPPLY;
        _gonBalances[msg.sender] = TOTAL_GONS;
        _gonsPerFragment = TOTAL_GONS.div(_totalSupply);

        // Assign needed approvals to external contracts and self for stable coin
        IERC20(_stableCoinAddress).approve(address(router), uint256(-1));
        IERC20(_stableCoinAddress).approve(
            address(_stableLiquidityPairAddress),
            uint256(-1)
        );
        IERC20(_stableCoinAddress).approve(address(this), uint256(-1));

        // Set initial local allowances
        _allowedFragments[address(this)][address(router)] = uint256(-1);
        _allowedFragments[address(this)][_nativeLiquidityPairAddress] = uint256(
            -1
        );
        _allowedFragments[address(this)][address(this)] = uint256(-1);
        _allowedFragments[address(this)][_stableLiquidityPairAddress] = uint256(
            -1
        );

        emit Transfer(address(0x0), _treasuryFeeReceiver, _totalSupply);

        // TODO: Any other setup items in LAUNCH-CHECKLIST.txt
    }

    // Accepting donations
    receive() external payable {}

    /**
     * @dev Determines if a rebase should take place.
     * In this implementation it is simply a check for whether enough time has passed.
     */
    function shouldRebase() internal view returns (bool) {
        return nextRebase <= block.timestamp;
    }

    /**
     * @dev Utility function to determine if a transfer should have fees taken.
     */
    function shouldTakeFee(address _sender, address _recipient)
        internal
        view
        returns (bool)
    {
        // If an address on either side of the transfer is exempt,
        // then the complete transfer is exempt.
        if (isFeeExempt[_sender] || isFeeExempt[_recipient]) {
            return false;
        } else if (feesOnNormalTransfers) {
            // This can be toggled by admins
            return true;
        } else {
            // If passing through the pair in any way. Buy/Sell
            return (isCorePair[_sender] || isCorePair[_recipient]);
        }
    }

    function _rebase() private {
        if (!inSwap) {
            coreRebase(getSupplyDelta());
        }
    }

    /**
     * @dev Performs the core rebasing mechanism for the token supply.
     * Updates the total supply based on circulating supply and reward yeild (provided through supply delta).
     * Updates `_gonsPerFragment` according to new total supply and sets next rebase time.
     */
    function coreRebase(int256 _supplyDelta) private returns (uint256) {
        uint256 epoch = block.timestamp;

        if (_supplyDelta == 0) {
            emit LogRebase(epoch, _totalSupply);
            return _totalSupply;
        }

        if (_supplyDelta < 0) {
            _totalSupply = _totalSupply.sub(uint256(-_supplyDelta));
        } else {
            _totalSupply = _totalSupply.add(uint256(_supplyDelta));
        }

        if (_totalSupply > MAX_SUPPLY) {
            _totalSupply = MAX_SUPPLY;
        }

        // Setting this updates the base/divisor/multiplier used for important calculations across the contract.
        _gonsPerFragment = TOTAL_GONS.div(_totalSupply);

        nextRebase = epoch + rebaseFrequencySeconds;

        emit LogRebase(epoch, _totalSupply);

        return _totalSupply;
    }

    /**
     * @dev Just a utility to run needed checks for `_transferFrom`.
     * Code looked cluttered/harder to read in that function
     */
    function _canTransfer(
        address _sender,
        address _recipient,
        uint256 _amount
    ) private view returns (bool) {
        // Avoid math overflow/underflow issues
        require(
            balanceOf(_sender) >= _amount,
            "AALTO: transfer amount exceeds balance"
        );

        bool excludedAccount = isFeeExempt[_sender] || isFeeExempt[_recipient];
        // fee exempt accounts are able to perform setup operations/transfers until distribution is complete
        require(
            initialDistributionFinished || excludedAccount,
            "AALTO: Trading not started yet"
        );

        // If someone is transferring into a pair(_recipient = one of our pair addresses), then they are selling
        if (isCorePair[_recipient] && !excludedAccount) {
            require(
                _amount <= maxSellTransactionAmount,
                "AALTO: Exceeds max sell amount"
            );
        }

        return true;
    }

    /**
     * @dev Runs checks to determine whether swapping to native/stable should take place.
     * The current contract balance (of itself), is swapped into the native or stable token.
     * Native or stable is determined by `isLiquidityInNative` in `swapBack()`
     */
    function shouldSwapBack() internal view returns (bool) {
        return
            !isCorePair[msg.sender] &&
            !inSwap &&
            swapEnabled &&
            totalBuyFee.add(totalSellFee) > 0 &&
            _gonBalances[address(this)] >= gonSwapThreshold;
    }

    /**
     * @dev Reduces the amount of a transfer based on being a buy or sell transfer.
     * Needed checks should happen before calling this function.
     * Function only determines whether a buy or sell is in progress and reduces amount accordingly.
     * Contracts own internal balance is updated by the fee amount taken.
     */
    function takeFee(
        address _sender,
        address _recipient,
        uint256 _gonAmount
    ) internal returns (uint256) {
        // If _recipient is one of our pairs then someone is selling the token
        uint256 realFee = isCorePair[_recipient] ? totalSellFee : totalBuyFee;

        // _gonAmount is already multiplied by _gonPerFragment at this point
        uint256 feeAmount = _gonAmount.mul(realFee).div(feeDenominator);

        feeAmount = _deductFeeBonusesFromTransfer(
            feeAmount,
            realFee == totalSellFee
        );

        // Update balance of contract itself
        _gonBalances[address(this)] = _gonBalances[address(this)].add(
            feeAmount
        );

        // format feeAmount back for outside viewing
        emit Transfer(_sender, address(this), feeAmount.div(_gonsPerFragment));

        return _gonAmount.sub(feeAmount);
    }

    /**
     * @dev Delegates handling of possible fee reductions
     */
    function _deductFeeBonusesFromTransfer(uint256 _feeAmount, bool isSelling)
        private
        view
        returns (uint256 newFeeAmount)
    {
        newFeeAmount = _feeAmount;

        if (samaritanFeeDiscountEnabled && samaritans[msg.sender]) {
            newFeeAmount = newFeeAmount.sub(
                newFeeAmount.mul(samaritanFeeDiscount).div(
                    samaritanFeeDiscountDenominator
                )
            );
        }

        // Pass along to keep chopping as needed
        newFeeAmount = _handleNftFeeReduction(newFeeAmount, isSelling);
    }

    function _handleNftFeeReduction(uint256 _feeAmount, bool isSelling)
        private
        view
        returns (uint256)
    {
        if (!nftFeeDiscountEnabled) {
            return _feeAmount;
        }

        for (uint256 i = 0; i < nfts.length; i++) {
            ProtocolNft memory nft = nfts[i];
            if (!nft.active) {
                continue;
            }

            if (IERC721(nft.contractAddress).balanceOf(msg.sender) > 0) {
                _feeAmount = isSelling
                    ? _feeAmount.sub(nft.sellFeeDiscount)
                    : _feeAmount.sub(nft.buyFeeDiscount);
            }
        }

        return _feeAmount;
    }

    /* ======================== TOKEN FUNCTIONS ========================= */

    /**
     * @dev Calculates the current change between circulating supply and reward yield.
     * Changes to token supply through burns and previous rebase changes to `_gonsPerFragment`,
     * will cause this delta to be always changing.
     * This value determines the amount the total supply will be changed by.
     * And by association determine the new value for `_gonsPerFragment`.
     */
    function getSupplyDelta() public view returns (int256) {
        uint256 circulatingSupply = getCirculatingSupply();
        int256 supplyDelta = int256(
            circulatingSupply.mul(rewardYield).div(rewardYieldDenominator)
        );

        return supplyDelta;
    }

    /**
     * @dev Calculates the current supply in circulation.
     * The accounting for this is different than traditional ERC20
     * due to the nature of the elastic supply and rebasing.
     * Circulating supply is influenced by tokens burned and current value of `_gonsPerFragment`.
     */
    function getCirculatingSupply() public view returns (uint256) {
        return
            (TOTAL_GONS.sub(_gonBalances[DEAD]).sub(_gonBalances[ZERO])).div(
                _gonsPerFragment
            );
    }

    /**
     * @dev Intercepts typical transfers to perform protocol operations.
     * Delegates taking of fees and triggering a rebase as needed.
     */
    function _transferFrom(
        address _sender,
        address _recipient,
        uint256 _amount
    ) internal notBlacklisted(msg.sender) returns (bool) {
        require(
            _canTransfer(_sender, _recipient, _amount),
            "Aalto: Transfer failed"
        );

        // Skip rest of process and basic transfer if we initiated this transfer
        if (inSwap) {
            return _basicTransfer(_sender, _recipient, _amount);
        }

        // Put the amount into proper formatting for our maths with `_gonsPerFragment`
        uint256 gonAmount = _amount.mul(_gonsPerFragment);

        if (shouldSwapBack()) {
            swapBack();
        }

        _gonBalances[_sender] = _gonBalances[_sender].sub(gonAmount);

        // Deduct fees as needed before updating receiver balance
        uint256 gonAmountReceived = shouldTakeFee(_sender, _recipient)
            ? takeFee(_sender, _recipient, gonAmount)
            : gonAmount;

        _gonBalances[_recipient] = _gonBalances[_recipient].add(
            gonAmountReceived
        );

        emit Transfer(
            _sender,
            _recipient,
            // div(_gonsPerFragment) to place back in outside format
            gonAmountReceived.div(_gonsPerFragment)
        );

        // shouldRebase = nextRebase <= block.timestamp
        if (shouldRebase() && autoRebase) {
            _rebase();

            // If one of our pairs was not involved in this transfer,
            // then update the pairs last cumulative prices and blockTimestampLast
            if (!isCorePair[_sender] && !isCorePair[_recipient]) {
                manualSyncPairs();
            }
        }

        return true;
    }

    /**
     * @dev The external facing transfer function.
     * Simply delegates the process to internal `_transferFrom`.
     */
    function transfer(address _to, uint256 _amount)
        external
        override
        validRecipient(_to)
        returns (bool)
    {
        _transferFrom(msg.sender, _to, _amount);
        return true;
    }

    /**
     * @dev Performs a simple updating of balances.
     * This is only used when transfers are happening as the result
     * of swap operations we are performing internally.
     */
    function _basicTransfer(
        address _from,
        address _to,
        uint256 _amount
    ) internal returns (bool) {
        uint256 gonAmount = _amount.mul(_gonsPerFragment);
        _gonBalances[_from] = _gonBalances[_from].sub(gonAmount);
        _gonBalances[_to] = _gonBalances[_to].add(gonAmount);

        emit Transfer(_from, _to, _amount);

        return true;
    }

    /**
     * @dev The external facing transferFrom function.
     * Only checks allowances and then delegates the rest of process to internal `_transferFrom`.
     */
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) external override validRecipient(_to) returns (bool) {
        if (_allowedFragments[_from][msg.sender] != uint256(-1)) {
            _allowedFragments[_from][msg.sender] = _allowedFragments[_from][
                msg.sender
            ].sub(_value, "Aalto: Insufficient Allowance");
        }

        _transferFrom(_from, _to, _value);
        return true;
    }

    /**
     * @dev Retrieves the amount that was used for INITIAL_FRAGMENTS_SUPPLY`.
     */
    function initialSupply() public pure returns (uint256) {
        return INITIAL_FRAGMENTS_SUPPLY;
    }

    /**
     * @dev Retrieves the value for `MAX_SUPPLY`.
     */
    function maxSupply() public pure returns (uint256) {
        return MAX_SUPPLY;
    }

    /**
     * @dev Retrieves the value for `TOTAL_GONS`.
     */
    function totalGons() public pure returns (uint256) {
        return TOTAL_GONS;
    }

    function gonsPerFragment() public view override returns (uint256) {
        return _gonsPerFragment;
    }

    /**
     * @dev Retrieves the current value for `_totalSupply`.
     */
    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    /**
      @dev Retrieves the allowance amount of `_spender` for `_owner`s tokens.
     */
    function allowance(address _owner, address _spender)
        external
        view
        override
        returns (uint256)
    {
        return _allowedFragments[_owner][_spender];
    }

    /**
     * @dev Retrieves the current amount of tokens held by `_who`.
     */
    function balanceOf(address _who) public view override returns (uint256) {
        return _gonBalances[_who].div(_gonsPerFragment);
    }

    /**
     * @dev Retrieves the total amount of tokens in lock staking by `_who`.
     * Details of lock times and current locks are in the staking contract itself.
     */
    function lockedBalanceOf(address _who) public view returns (uint256) {
        return _lockedBalances[_who].div(_gonsPerFragment);
    }

    /**
     *  @dev Decreases allowance of `_spender` for callers tokens by `_subtractedValue`.
     */
    function decreaseAllowance(address _spender, uint256 _subtractedValue)
        external
        returns (bool)
    {
        uint256 oldValue = _allowedFragments[msg.sender][_spender];
        if (_subtractedValue >= oldValue) {
            _allowedFragments[msg.sender][_spender] = 0;
        } else {
            _allowedFragments[msg.sender][_spender] = oldValue.sub(
                _subtractedValue
            );
        }
        emit Approval(
            msg.sender,
            _spender,
            _allowedFragments[msg.sender][_spender]
        );
        return true;
    }

    /**
     * @dev Increases allowance of `_spender` for callers tokens for `_addedValue`.
     */
    function increaseAllowance(address _spender, uint256 _addedValue)
        external
        returns (bool)
    {
        _allowedFragments[msg.sender][_spender] = _allowedFragments[msg.sender][
            _spender
        ].add(_addedValue);

        emit Approval(
            msg.sender,
            _spender,
            _allowedFragments[msg.sender][_spender]
        );

        return true;
    }

    /**
     * @dev Overrides default implementation of `approve` to manage approvals internally.
     */
    function approve(address spender, uint256 value)
        external
        override
        returns (bool)
    {
        _allowedFragments[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    /* ======================== STAKING ========================= */

    function stake(uint256 _poolId, uint256 _amount)
        external
        notBlacklisted(msg.sender)
        nonReentrant
        ifStakingEnabled
    {
        require(_amount > 0, "AALTO: Can not stake zero");
        require(
            balanceOf(msg.sender) >= _amount,
            "AALTO: Insufficient balance"
        );

        _amount = _amount.mul(_gonsPerFragment);

        // Locked balances still get the rebase effect
        _gonBalances[msg.sender] = _gonBalances[msg.sender].sub(_amount);
        _lockedBalances[msg.sender] = _lockedBalances[msg.sender].add(_amount);

        // Any additional checks bubbled by staking contract
        staking.stake(_poolId, _amount, msg.sender);
    }

    function withdrawStaking(uint256 _poolId) external nonReentrant {
        // Any additional checks bubbled by staking contract
        uint256 amountUnlocked = staking.withdraw(_poolId, msg.sender);

        // Balances updated using the returned result
        // Would ideally want this after.
        // Function has guard and does not make untrusted external calls
        _lockedBalances[msg.sender] = _lockedBalances[msg.sender].sub(
            amountUnlocked
        );
        _gonBalances[msg.sender] = _gonBalances[msg.sender].add(amountUnlocked);
    }

    /**
     * @dev Allows user to move a stake from one pool to a higher lock time pool
     * User interacts through this contract for needed checks and balances
     */
    function moveToHigherPool(uint256 _currentPoolId, uint256 _newPoolId)
        external
        notBlacklisted(msg.sender)
        nonReentrant
        ifStakingEnabled
    {
        // Any additional checks bubbled by staking contract
        staking.moveToHigherPool(_currentPoolId, _newPoolId, msg.sender);
    }

    function increaseStakeInCurrentPool(uint256 _poolId, uint256 _amount)
        external
        notBlacklisted(msg.sender)
        nonReentrant
        ifStakingEnabled
    {
        require(_amount > 0, "AALTO: Can not stake zero");
        require(
            balanceOf(msg.sender) >= _amount,
            "AALTO: Insufficient balance"
        );

        _amount = _amount.mul(_gonsPerFragment);

        // Shift balances
        _gonBalances[msg.sender] = _gonBalances[msg.sender].sub(_amount);
        _lockedBalances[msg.sender] = _lockedBalances[msg.sender].add(_amount);

        // Any additional checks bubbled by staking contract
        staking.increaseStakeInCurrentPool(_poolId, _amount, msg.sender);
    }

    /**
     * @dev Allow team to provide stake for a user.
     * Used for partnerships and such.
     * Tokens are immediately staked according to agreeement to avoid dumping.
     * Tokens need to come from Treasury
     */
    function stakeForUser(
        uint256 _poolId,
        address _forUser,
        uint256 _amount
    ) external notBlacklisted(_forUser) ifStakingEnabled onlyOwner {
        require(_amount > 0, "AALTO: Can not stake zero");
        require(
            balanceOf(treasuryFeeReceiver) >= _amount,
            "AALTO: Treasury has insufficient balance"
        );

        _amount = _amount.mul(_gonsPerFragment);

        // Shift balances
        _gonBalances[treasuryFeeReceiver] = _gonBalances[treasuryFeeReceiver]
            .sub(_amount);
        _lockedBalances[_forUser] = _lockedBalances[_forUser].add(_amount);

        staking.stakeForUser(_poolId, _forUser, _amount);
    }

    /* ====================== SWAP/LP RELATED FUNCTIONS =====================  */

    /**
     * @dev Swaps current contract balance and provides liquidity.
     * Balance is swapped into the native token or into the stable token,
     * depending on current setting for `isLiquidityInNative`.
     */
    function _swapAndLiquify(uint256 _contractTokenBalance) private {
        uint256 half = _contractTokenBalance.div(2);
        uint256 otherHalf = _contractTokenBalance.sub(half);

        if (isLiquidityInNative) {
            uint256 initialBalance = address(this).balance;

            _swapTokensForNative(half, address(this));

            uint256 newBalance = address(this).balance.sub(initialBalance);

            _addLiquidityNative(otherHalf, newBalance);

            emit SwapAndLiquify(half, newBalance, otherHalf);
        } else {
            uint256 initialBalance = IERC20(stableCoinAddress).balanceOf(
                address(this)
            );

            _swapTokensForStable(half, address(this));

            uint256 newBalance = IERC20(stableCoinAddress)
                .balanceOf(address(this))
                .sub(initialBalance);

            _addLiquidityStable(otherHalf, newBalance);

            emit SwapAndLiquifyBusd(half, newBalance, otherHalf);
        }
    }

    /**
     * @dev Adds liquidity for native token and "this" token.
     */
    function _addLiquidityNative(uint256 _tokenAmount, uint256 _nativeAmount)
        private
    {
        router.addLiquidityETH{value: _nativeAmount}(
            address(this),
            _tokenAmount,
            0,
            0,
            liquidityTokensReceiver,
            block.timestamp
        );
    }

    /**
     * @dev Adds liquidity for the stable token and "this" token.
     */
    function _addLiquidityStable(uint256 _tokenAmount, uint256 _stableAmount)
        private
    {
        router.addLiquidity(
            address(this),
            stableCoinAddress,
            _tokenAmount,
            _stableAmount,
            0,
            0,
            liquidityTokensReceiver,
            block.timestamp
        );
    }

    /**
     * @dev Used to swap some amount of this token into the native token.
     */
    function _swapTokensForNative(uint256 _tokenAmount, address _receiver)
        private
    {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = router.WETH();

        router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            _tokenAmount,
            0,
            path,
            _receiver,
            block.timestamp
        );
    }

    /**
     * @dev Used to swap some amount of this token into the stable token.
     */
    function _swapTokensForStable(uint256 _tokenAmount, address _receiver)
        private
    {
        address[] memory path = new address[](3);
        path[0] = address(this);
        path[1] = router.WETH();
        path[2] = stableCoinAddress;

        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            _tokenAmount,
            0,
            path,
            _receiver,
            block.timestamp
        );
    }

    /**
     * @dev Performs the swapping and transfer of contract balances to fee recipients.
     * Transfers to recipients is handled through setting them as receiver of DEX outputs.
     */
    function swapBack() internal swapping {
        uint256 realTotalFee = totalBuyFee.add(totalSellFee);

        // targetLiquidity default is 50%
        // liquidityFee is applied if we are over target threshold
        uint256 dynamicLiquidityFee = isOverLiquified(
            targetLiquidity,
            targetLiquidityDenominator
        )
            ? 0
            : liquidityFee;

        uint256 contractTokenBalance = contractBalance();

        uint256 amountToLiquify = contractTokenBalance
            .mul(dynamicLiquidityFee.mul(2))
            .div(realTotalFee);

        uint256 amountToInsuranceFund = contractTokenBalance
            .mul(buyFeeInsuranceFund.mul(2).add(sellFeeInsuranceFund))
            .div(realTotalFee);

        uint256 amountToTreasury = contractTokenBalance
            .sub(amountToLiquify)
            .sub(amountToInsuranceFund);

        uint256 amountToNftHolders = 0;

        if (amountToLiquify > 0) {
            _swapAndLiquify(amountToLiquify);
        }

        if (amountToInsuranceFund > 0) {
            _swapTokensForStable(amountToInsuranceFund, insuranceFeeReceiver);
        }

        if (amountToTreasury > 0) {
            _swapTokensForNative(amountToTreasury, treasuryFeeReceiver);
        }

        emit SwapBack(
            contractTokenBalance,
            amountToLiquify,
            amountToInsuranceFund,
            amountToTreasury,
            amountToNftHolders
        );
    }

    /* ====================== SWAP/LP HELPERS ====================  */

    /**
     * @dev Function to check whether contract is over/under the target liquidity.
     * The target liquidity threshold can be admin adjusted as needed.
     */
    function isOverLiquified(uint256 target, uint256 accuracy)
        public
        view
        returns (bool)
    {
        return getLiquidityBacking(accuracy) > target;
    }

    /**
     * @dev Totals up the amount of "this" token in each of the `corePairs` pairs.
     */
    function getLiquidityBacking(uint256 _accuracy)
        public
        view
        returns (uint256)
    {
        uint256 liquidityBalance = 0;
        uint256 divisor = 10**9;
        for (uint256 i = 0; i < corePairs.length; i++) {
            uint256 pairBalanceDivided = balanceOf(corePairs[i]).div(divisor);
            liquidityBalance.add(pairBalanceDivided);
        }

        uint256 circulatingDivided = getCirculatingSupply().div(divisor);

        return _accuracy.mul(liquidityBalance.mul(2)).div(circulatingDivided);
    }

    /**
     * @dev Gets the `gonSwapThreshold` in format inline with current `_gonsPerFragment`
     */
    function checkSwapThreshold() external view returns (uint256) {
        return gonSwapThreshold.div(_gonsPerFragment);
    }

    function manualSyncPairs() public {
        for (uint256 i = 0; i < corePairs.length; i++) {
            IUniswapV2Pair(corePairs[i]).sync();
        }
    }

    /* ======================= ADMIN FUNCTIONS ========================= */

    /**
     * @dev Sets contract address for staking/locking contract.
     */
    function setStaking(address _stakingContractAddress) external onlyOwner {
        require(
            _stakingContractAddress != address(0),
            "AALTO: 0x0 _stakingContractAddress"
        );

        staking = IStaking(_stakingContractAddress);
        stakingEnabled = true;
        isFeeExempt[_stakingContractAddress] = true;
    }

    function toggleStakingEnabled(bool _enabled) external onlyOwner {
        require(stakingEnabled != _enabled, "AALTO: Value not changed");

        stakingEnabled = _enabled;
    }

    /**
     * @dev Sets value for `initialDistributionFinished`.
     * @dev Transfers are not possible by anyone except those fee exempt until this is set.
     * Ability to toggle enables pausing during setup/launch in case of any issues.
     */
    function setInitialDistributionFinished(bool _finished) external onlyOwner {
        require(
            initialDistributionFinished != _finished,
            "AALTO: Value not changed"
        );

        initialDistributionFinished = _finished;
    }

    /**
     * @dev Sets value for `targetLiquidity` and associated denominator `targetLiquidityDenominator`.
     */
    function setTargetLiquidity(uint256 _target, uint256 _denominator)
        external
        onlyOwner
    {
        targetLiquidity = _target;
        targetLiquidityDenominator = _denominator;
    }

    function setSwapBackSettings(
        bool _enabled,
        uint256 _numerator,
        uint256 _denomominator
    ) external onlyOwner {
        swapEnabled = _enabled;
        // gonSwapThreshold = TOTAL_GONS.div(_denomominator).mul(_numerator);
        // TODO: Audit recommendation (makes sense but test effects if any)
        gonSwapThreshold = TOTAL_GONS.mul(_numerator).div(_denomominator);
    }

    /**
     * @dev Sets the contract address for the protocol NFT project.
     * NFT holders receive a portion of fees when active.
     */
    function setNftContract(address _nftContractAddress) external onlyOwner {
        require(
            _nftContractAddress != address(0),
            "AALTO: 0x0 _nftContractAddress"
        );

        nftContractAddress = _nftContractAddress;
    }

    function clearStuckBalance(address _receiver) external onlyOwner {
        uint256 balance = address(this).balance;
        payable(_receiver).transfer(balance);
    }

    function rescueToken(address _tokenAddress, uint256 _amount)
        external
        onlyOwner
        returns (bool success)
    {
        return ERC20Detailed(_tokenAddress).transfer(msg.sender, _amount);
    }

    /**
     * @dev Toggles value for `autoRebase`.
     */
    function setAutoRebase(bool _autoRebase) external onlyOwner {
        require(autoRebase != _autoRebase, "AALTO: Value not changed");

        autoRebase = _autoRebase;
    }

    /**
      @dev Sets `rebaseFrequency`. 
      @param _rebaseFrequencySeconds must be smaller than `MAX_REBASE_FREQUENCY`
     */
    function setRebaseFrequencySeconds(uint256 _rebaseFrequencySeconds)
        external
        onlyOwner
    {
        require(
            _rebaseFrequencySeconds <= MAX_REBASE_FREQUENCY,
            "AALTO: Rebase frequencey too high"
        );

        rebaseFrequencySeconds = _rebaseFrequencySeconds;
    }

    /**
     * @dev Sets both `rewardYield` and `rewardYieldDenominator`
     */
    function setRewardYield(
        uint256 _rewardYield,
        uint256 _rewardYieldDenominator
    ) external onlyOwner {
        rewardYield = _rewardYield;
        rewardYieldDenominator = _rewardYieldDenominator;
    }

    /**
      @dev Toggles value for `isLiquidityInNative`
     */
    function setIsLiquidityInNative(bool _value) external onlyOwner {
        require(isLiquidityInNative != _value, "AALTO: Value not changed");

        isLiquidityInNative = _value;
    }

    /**
     * @dev Overrides current `nextRebase` time
     */
    function setNextRebase(uint256 _nextRebase) external onlyOwner {
        nextRebase = _nextRebase;
    }

    /**
     * @dev Sets `maxSellTransactionAmount`
     */
    function setMaxSellTransaction(uint256 _maxTxn) external onlyOwner {
        // Should be some sort of bounds for this, an event, suttin
        maxSellTransactionAmount = _maxTxn;
    }

    /**
     * @dev Adds or removes an LP pair from the list used to track backing liquidity.
     */
    function setAutomatedMarketMakerPair(address _pair, bool _value)
        public
        onlyOwner
    {
        require(isCorePair[_pair] != _value, "Value already set");

        isCorePair[_pair] = _value;

        if (_value) {
            corePairs.push(_pair);
        } else {
            require(
                corePairs.length > 1,
                "AALTO: Required at 1 pair in corePairs"
            );

            // Find the pair being set to false and remove from `_corePairs`
            for (uint256 i = 0; i < corePairs.length; i++) {
                if (corePairs[i] == _pair) {
                    corePairs[i] = corePairs[corePairs.length - 1];
                    corePairs.pop();
                    break;
                }
            }
        }

        emit SetAutomatedMarketMakerPair(_pair, _value);
    }

    /**
     * @dev Allows admins to manually trigger a rebase as needed.
     */
    function manualRebase() external onlyOwner {
        require(!inSwap, "AALTO: In swap. Try again");
        require(
            nextRebase <= block.timestamp,
            "AALTO: Next rebase already passed"
        );

        coreRebase(getSupplyDelta());
        manualSyncPairs();
    }

    /* =================  UI HELPERS  ==================== */

    function contractBalance() public view returns (uint256) {
        return balanceOf(address(this));
    }

    /* ================= MODIFIERS ================= */

    bool inSwap;

    modifier swapping() {
        inSwap = true;
        _;
        inSwap = false;
    }

    modifier validRecipient(address to) {
        require(to != address(0x0), "Sending to zero address");
        _;
    }

    modifier ifStakingEnabled() {
        require(stakingEnabled, "AALTO: Staking not enabled");
        _;
    }

    /* ================== EVENTS ==================== */

    event SwapBack(
        uint256 contractTokenBalance,
        uint256 amountToLiquify,
        uint256 amountToRFV,
        uint256 amountToTreasury,
        uint256 amountToNftHolders
    );
    event SwapAndLiquify(
        uint256 tokensSwapped,
        uint256 nativeReceived,
        uint256 tokensIntoLiqudity
    );
    event SwapAndLiquifyBusd(
        uint256 tokensSwapped,
        uint256 stableReceived,
        uint256 tokensIntoLiqudity
    );
    event LogRebase(uint256 indexed epoch, uint256 totalSupply);
    event SetAutomatedMarketMakerPair(address indexed pair, bool indexed value);
}
