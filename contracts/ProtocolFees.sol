// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity 0.7.4;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./libs/SafeMathInt.sol";
import "./structs.sol";

contract ProtocolFees is Ownable {
    using SafeMath for uint256;
    using SafeMathInt for int256;

    struct FeeInfo {
        uint256 liquidityFee;
        uint256 buyFeeTreasury;
        uint256 buyFeeInsuranceFund;
        uint256 buyFeeNFT;
        uint256 sellFeeTreasury;
        uint256 sellFeeInsuranceFund;
        uint256 sellFeeNFT;
        uint256 totalBuyFee;
        uint256 totalSellFee;
        uint256 feeDenominator;
    }

    struct FeeReceivers {
        address treasuryFeeReceiver;
        address liquidityTokensReceiver;
        address insuranceFeeReceiver;
        address nftFeeReceiver;
        address stakingFeeReceiver;
    }

    /* ================ FEE RECEIVERS ================== */

    // `Treasure Trove` treasury address
    address public treasuryFeeReceiver;

    // Receiver of LP tokens generated for protocol
    address public liquidityTokensReceiver;

    // `Coral Preservation` Insurance Fund
    address public insuranceFeeReceiver;

    // Address NFT holder incentive fees are sent to
    address public nftFeeReceiver;

    // Address where `AALTO Reflections`fees for stakers are sent
    address public stakingFeeReceiver;

    /* ================= FEES =================== */

    // Max total fee % for any one buy/sell fee
    uint256 public constant MAX_FEE_RATE = 25;

    // Mapping of addresses that that will not be charges transfer fees
    mapping(address => bool) internal isFeeExempt;

    bool public feesOnNormalTransfers = false;

    /* =========== SHARED(BUY/SELL) FEES ============ */

    // Rising Tide (Auto Liquidity) fee
    uint256 public liquidityFee = 5;

    /* ================ NFT ITEMS ================== */

    // Tier based protocol NFTs mapping
    mapping(address => ProtocolNft) public protocolNfts;

    // Index based
    ProtocolNft[] public nfts;

    uint256 public nftFeeDiscount = 2;

    uint256 public nftFeeDiscountDenominator = 100;

    bool public nftFeeDiscountEnabled = false;

    /* ================ BUY FEES ================== */

    // Percentage of buy fee that buys/burns token
    uint256 public buyFeeBurn = 2;

    // Percentage of buy fee that goes to treasury
    uint256 public buyFeeTreasury = 3;

    // `Coral Preservation` Insurance Fund fee
    uint256 public buyFeeInsuranceFund = 4;

    uint256 public buyFeeNFT = 0;

    // `AALTO Reflections`. Staking rewards
    uint256 public buyFeeStakers = 1;

    uint256 public totalBuyFee =
        liquidityFee
            .add(buyFeeTreasury)
            .add(buyFeeInsuranceFund)
            .add(buyFeeNFT)
            .add(buyFeeStakers);

    /* ================ SELL FEES ================== */

    // Percentage of sell fee that buys/burns token
    uint256 public sellFeeBurn = 3;

    // `Treasure Trove` treasury fee
    uint256 public sellFeeTreasury = 7;

    // `Coral Preservation` Insurance Fund fee
    uint256 public sellFeeInsuranceFund = 4;

    uint256 public sellFeeNFT = 0;

    // `AALTO Reflections`. Staking rewards
    uint256 public sellFeeStakers = 1;

    // Sell fee is total of totalBuyFee + sell fees
    uint256 public totalSellFee =
        totalBuyFee
            .add(sellFeeTreasury)
            .add(sellFeeInsuranceFund)
            .add(sellFeeNFT)
            .add(sellFeeStakers);

    uint256 public feeDenominator = 100;

    uint256 public samaritanFeeDiscount = 2;

    uint256 public samaritanFeeDiscountDenominator = 100;

    bool public samaritanFeeDiscountEnabled = false;

    /* ================ BLACKLIST/BONUS LIST ================== */

    // Cause some people choose to be sucky
    mapping(address => bool) internal blacklist;

    // Addresses of early community members who helped along the way
    mapping(address => bool) internal samaritans;

    constructor(
        address _treasuryFeeReceiver,
        address _insuranceFeeReceiver,
        address _nftFeeReceiver,
        address _stakingFeeReceiver,
        address _liquityTokensReceiver
    ) {
        require(
            _treasuryFeeReceiver != address(0),
            "AALTO: 0x0 treasuryFeeReceiver"
        );
        require(
            _insuranceFeeReceiver != address(0),
            "AALTO: 0x0 _insuranceFeeReceiver"
        );
        require(
            _stakingFeeReceiver != address(0),
            "AALTO: 0x0 _stakingFeeReceiver"
        );
        require(
            _liquityTokensReceiver != address(0),
            "AALTO: 0x0 _liquityTokensReceiver"
        );

        // nftFeeReceiver can be address(0) from start

        treasuryFeeReceiver = _treasuryFeeReceiver;
        insuranceFeeReceiver = _insuranceFeeReceiver;
        nftFeeReceiver = _nftFeeReceiver;
        stakingFeeReceiver = _stakingFeeReceiver;
        liquidityTokensReceiver = _liquityTokensReceiver;

        // Set initial/default fee exemptions
        isFeeExempt[treasuryFeeReceiver] = true;
        isFeeExempt[insuranceFeeReceiver] = true;
        isFeeExempt[stakingFeeReceiver] = true;
        isFeeExempt[address(this)] = true;
        isFeeExempt[msg.sender] = true;
    }

    function checkFeeExempt(address _addr) external view returns (bool) {
        return isFeeExempt[_addr];
    }

    /* ======================== UI/API HELPERS ========================= */

    function getFees() public view returns (FeeInfo memory info) {
        info.liquidityFee = liquidityFee;
        info.buyFeeTreasury = buyFeeTreasury;
        info.buyFeeInsuranceFund = buyFeeInsuranceFund;
        info.buyFeeNFT = buyFeeNFT;
        info.sellFeeTreasury = sellFeeTreasury;
        info.sellFeeInsuranceFund = sellFeeInsuranceFund;
        info.sellFeeNFT = sellFeeNFT;
        info.totalBuyFee = totalBuyFee;
        info.totalSellFee = totalSellFee;
        info.feeDenominator = feeDenominator;
    }

    function getFeeReceivers() public view returns (FeeReceivers memory) {
        return
            FeeReceivers(
                treasuryFeeReceiver,
                liquidityTokensReceiver,
                insuranceFeeReceiver,
                nftFeeReceiver,
                stakingFeeReceiver
            );
    }

    /* ======================= ADMIN FUNCTIONS ======================= */

    function updateBlacklist(address _who, bool _value) external onlyOwner {
        require(_who != address(0), "AALTO: 0x0 who");
        require(blacklist[_who] != _value, "AALTO: Value not changed");

        blacklist[_who] = _value;
    }

    function updateSamaritanlist(address _who, bool _value) external onlyOwner {
        require(_who != address(0), "AALTO: 0x0 who");
        require(samaritans[_who] != _value, "AALTO: Value not changed");

        samaritans[_who] = _value;
    }

    function setFeeExempt(address _addr, bool _value) external onlyOwner {
        require(isFeeExempt[_addr] != _value, "AALTO: Value not changed");

        isFeeExempt[_addr] = _value;
    }

    function setFeesOnNormalTransfers(bool _enabled) external onlyOwner {
        require(feesOnNormalTransfers != _enabled, "AALTO: Value not changed");

        feesOnNormalTransfers = _enabled;
        emit UpdatFeeOnNormalTransferse(_enabled);
    }

    function setFeeReceivers(
        address _treasuryReceiver,
        address _insuranceFundReceiver,
        address _nftFeeReceiver,
        address _stakingFeeReceiver
    ) external onlyOwner {
        require(
            _treasuryReceiver != address(0),
            "AALTO: 0x0 _treasuryReceiver"
        );
        require(
            _insuranceFundReceiver != address(0),
            "AALTO: 0x0 _insuranceFundReceiver"
        );
        require(
            _stakingFeeReceiver != address(0),
            "AALTO: 0x0 stakingFeeReceiver"
        );
        // _nftFeeReceiver can be 0x0

        treasuryFeeReceiver = _treasuryReceiver;
        insuranceFeeReceiver = _insuranceFundReceiver;
        nftFeeReceiver = _nftFeeReceiver;
        stakingFeeReceiver = _stakingFeeReceiver;

        emit UpdatFeeReceivers(
            _treasuryReceiver,
            _insuranceFundReceiver,
            _nftFeeReceiver,
            _stakingFeeReceiver
        );
    }

    function setFees(
        uint256 _liquidityFee,
        uint256 _buyFeeInsuranceFund,
        uint256 _buyFeeNFT,
        uint256 _buyFeeTreasury,
        uint256 _sellFeeTreasury,
        uint256 _sellFeeInsuranceFund,
        uint256 _sellFeeNFT,
        uint256 _feeDenominator
    ) external onlyOwner {
        require(
            _liquidityFee <= MAX_FEE_RATE &&
                _buyFeeNFT <= MAX_FEE_RATE &&
                _buyFeeInsuranceFund <= MAX_FEE_RATE &&
                _buyFeeTreasury <= MAX_FEE_RATE &&
                _sellFeeTreasury <= MAX_FEE_RATE &&
                _sellFeeInsuranceFund <= MAX_FEE_RATE &&
                _sellFeeNFT <= MAX_FEE_RATE,
            "AALTO: Max fee exceeded"
        );

        liquidityFee = _liquidityFee;
        buyFeeTreasury = _buyFeeTreasury;

        buyFeeInsuranceFund = _buyFeeInsuranceFund;
        buyFeeNFT = _buyFeeNFT;

        sellFeeTreasury = _sellFeeTreasury;
        sellFeeInsuranceFund = _sellFeeInsuranceFund;
        sellFeeNFT = _sellFeeNFT;

        totalBuyFee = liquidityFee
            .add(buyFeeTreasury)
            .add(buyFeeInsuranceFund)
            .add(buyFeeNFT);

        totalSellFee = totalBuyFee
            .add(sellFeeTreasury)
            .add(sellFeeInsuranceFund)
            .add(sellFeeNFT);

        feeDenominator = _feeDenominator;

        // No check for sell fee?
        require(
            totalBuyFee < feeDenominator / 4,
            "AALTO: New totalBuyFee is > feeDenominator / 4"
        );
    }

    function toggleNftDiscountEnabled(bool _enabled) external onlyOwner {
        require(nftFeeDiscountEnabled != _enabled, "AALTO: Value not changed");

        nftFeeDiscountEnabled = _enabled;
        emit UpdatNftDiscountEnabled(_enabled);
    }

    function setNftFeeDiscount(uint256 _numerator, uint256 _denominator)
        external
        onlyOwner
    {
        nftFeeDiscount = _numerator;
        nftFeeDiscountDenominator = _denominator;
        emit UpdatNftDiscount(_numerator, _denominator);
    }

    function toggleSamaritanDiscountEnabled(bool _enabled) external onlyOwner {
        require(
            samaritanFeeDiscountEnabled != _enabled,
            "AALTO: Value not changed"
        );

        samaritanFeeDiscountEnabled = _enabled;
        emit UpdatSmaritanDiscountEnabled(_enabled);
    }

    function setSamaritanFeeDiscount(uint256 _numerator, uint256 _denominator)
        external
        onlyOwner
    {
        nftFeeDiscount = _numerator;
        nftFeeDiscountDenominator = _denominator;
        emit UpdatSamaritanDiscount(_numerator, _denominator);
    }

    /* ================ MODIFIERS ================== */

    modifier notBlacklisted(address _account) {
        require(blacklist[_account] == false, "AALTO: Blacklisted account");
        _;
    }

    /* ================ EVENTS ================== */

    event UpdatFeeOnNormalTransferse(bool indexed setTo);
    event UpdatFeeReceivers(
        address treasuryReceiver,
        address insuranceFundReceiver,
        address nftFeeReceiver,
        address stakingFeeReceiver
    );
    event UpdatNftDiscountEnabled(bool indexed setTo);
    event UpdatSamaritanDiscount(
        uint256 indexed _numerator,
        uint256 indexed _denominator
    );
    event UpdatSmaritanDiscountEnabled(bool indexed setTo);
    event UpdatNftDiscount(
        uint256 indexed _numerator,
        uint256 indexed _denominator
    );
}
