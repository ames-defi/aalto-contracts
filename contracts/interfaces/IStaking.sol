// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

interface IStaking {
    function stake(
        uint256 _poolId,
        uint256 _amount,
        address _user
    ) external returns (bool);

    function userCanWithdraw(uint256 _poolId, address _user)
        external
        view
        returns (bool);

    function userCanStake(uint256 _poolId, address _user)
        external
        view
        returns (bool);

    function withdraw(uint256 _poolId, address _user)
        external
        returns (uint256);

    function increaseStakeInCurrentPool(
        uint256 _poolId,
        uint256 _amount,
        address _user
    ) external;

    function moveToHigherPool(
        uint256 _currentPoolId,
        uint256 _newPoolId,
        address _user
    ) external;

    function stakeForUser(
        uint256 _poolId,
        address _forUser,
        uint256 _amount
    ) external;
}
