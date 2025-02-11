// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LockTokens Contract
 * @notice A smart contract for locking ERC20 tokens for a specified duration.
 * @dev This contract uses OpenZeppelin's `Ownable2Step` for ownership management.
 */
contract LockTokens is Ownable2Step {
    /**
     * @notice Error indicating the provided amount is invalid (zero).
     */
    error InvalidAmount();

    /**
     * @notice Error indicating the lock duration is out of the allowed range.
     */
    error InvalidLockDuration();

    /**
     * @notice Error indicating insufficient balance for locking tokens.
     */
    error InsufficientBalance();

    /**
     * @notice Error for unused invalid lock index cases.
     */
    error InvalidLockIndex();

    /**
     * @notice Error indicating a token transfer failure.
     */
    error TokenTransferFailed();

    /**
     * @notice Error indicating that the tokens have already been withdrawn.
     */
    error TokensAlreadyWithdrawn();

    /**
     * @notice Error indicating the tokens are still locked and cannot be withdrawn yet.
     */
    error TokensStillLocked();

    error NotOwner();

    /**
     * @notice Minimum lock duration (1 day).
     */
    uint256 constant MIN_LOCK_DURATION = 30 seconds;

    /**
     * @notice Maximum lock duration (360 days).
     */
    uint256 constant MAX_LOCK_DURATION = 365 days;

    /**
     * @notice The ERC20 token that can be locked in this contract.
     */
    IERC20 public immutable token;

    /**
     * @notice Struct to store lock details for a user.
     * @param amount The amount of tokens locked.
     * @param startLockTime The timestamp when the lock started.
     * @param endLockTime The timestamp when the lock ends.
     * @param isWithdrawn Whether the tokens have been withdrawn.
     */
    struct Lock {
        uint256 amount;
        uint256 startLockTime;
        uint256 endLockTime;
        bool isWithdrawn;
    }

    /**
     * @notice Mapping from user address to their lock details.
     */
    mapping(address => Lock) public userLocks;


    /**
     * @notice Deploy the LockTokens contract and set the token address.
     * @param _tokenAddress The address of the ERC20 token that can be locked.
     */
    constructor(address _tokenAddress) Ownable(msg.sender) {
        token = IERC20(_tokenAddress);
    }

    /**
     * @notice Locks a specified amount of tokens for a specified duration.
     * @dev The user must approve the contract to spend the tokens before calling this function.
     * @param _amount The amount of tokens to lock.
     * @param _lockDuration The duration for which the tokens will be locked.
     * @custom:throws InvalidAmount Thrown if `_amount` is zero.
     * @custom:throws InvalidLockDuration Thrown if `_lockDuration` is out of the valid range.
     * @custom:throws InsufficientBalance Thrown if the user's balance is insufficient.
     * @custom:throws TokenTransferFailed Thrown if the token transfer fails.
     */
    function lockTokens(address _userAddress, uint256 _amount, uint256 _lockDuration) external onlyOwner() {
        if (_amount == 0) revert InvalidAmount();
        if ((block.timestamp + _lockDuration) < (block.timestamp + MIN_LOCK_DURATION) || (block.timestamp + _lockDuration) > block.timestamp + MAX_LOCK_DURATION) {
            revert InvalidLockDuration();
        }
        if (token.balanceOf(msg.sender) < _amount) revert InsufficientBalance();

        uint256 startLockTime = block.timestamp;
        uint256 endLockTime = startLockTime + _lockDuration;

        bool success = token.transferFrom(msg.sender, address(this), _amount);
        if (!success) revert TokenTransferFailed();

        userLocks[_userAddress] = Lock({
            amount: _amount,
            startLockTime: startLockTime,
            endLockTime: endLockTime,
            isWithdrawn: false
        });
    }

    /**
     * @notice Withdraws the locked tokens after the lock period ends.
     * @dev The caller must have locked tokens that have not been withdrawn.
     * @custom:throws TokensAlreadyWithdrawn Thrown if the tokens have already been withdrawn.
     * @custom:throws TokensStillLocked Thrown if the lock duration has not yet ended.
     * @custom:throws TokenTransferFailed Thrown if the token transfer fails.
     */
    function withdrawTokens(address _user) external onlyOwner(){
        Lock storage lock = userLocks[_user];

        if (lock.amount == 0 || lock.isWithdrawn) revert TokensAlreadyWithdrawn();
        if (block.timestamp < lock.endLockTime) revert TokensStillLocked();

        lock.isWithdrawn = true;

        bool success = token.transfer(_user, lock.amount);
        if (!success) revert TokenTransferFailed();
    }

    /**
     * @notice Retrieves the lock details of a specific user.
     * @param _user The address of the user whose lock details are being queried.
     * @return amount The amount of tokens locked by the user.
     * @return startLockTime The timestamp when the lock started.
     * @return endLockTime The timestamp when the lock ends.
     * @return isWithdrawn Whether the tokens have been withdrawn
     */
    function getLockDetails(address _user)
        external
        view
        returns (
            uint256 amount,
            uint256 startLockTime,
            uint256 endLockTime,
            bool isWithdrawn
        )
    {
        Lock storage lock = userLocks[_user];
        return (lock.amount, lock.startLockTime, lock.endLockTime, lock.isWithdrawn);
    }
}
