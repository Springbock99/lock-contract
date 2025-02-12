// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Test.sol";
import {LockTokens} from "../contracts/LockTokens.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MTK") {
        _mint(msg.sender, 1000000 * 10 ** 18);
    }
}

contract LockTokens_Test is Test {
    LockTokens public lockTokens;
    MockERC20 public token;
    address public owner;
    address public user1;
    address public user2;
    uint256 public constant INITIAL_BALANCE = 1000 * 10 ** 18;

    function setUp() public {
        token = new MockERC20();
        lockTokens = new LockTokens(address(token));

        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");

        deal(address(token), owner, INITIAL_BALANCE);
        // deal(address(token), user1, INITIAL_BALANCE);
        // deal(address(token), user2, INITIAL_BALANCE);

        vm.startPrank(owner);
        token.approve(address(lockTokens), type(uint256).max);
        vm.stopPrank();
    }

    function test_lockTokens() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 duration = 7 days;
        uint256 initialBalance = token.balanceOf(owner);

        vm.startPrank(owner);
        lockTokens.lockTokens(user1, amount, duration);

        assertEq(token.balanceOf(address(lockTokens)), amount);
        assertEq(token.balanceOf(owner), initialBalance - amount);

        vm.stopPrank();
    }

    function test_withdrawWhileLocked() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 duration = 7 days;

        vm.prank(owner);
        lockTokens.lockTokens(user1, amount, duration);

        vm.expectRevert(LockTokens.TokensStillLocked.selector);
        vm.prank(owner);
        lockTokens.withdrawTokens(user1);
    }

    function test_withdrawAfterLockPeriod() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 duration = 7 days;

        vm.prank(owner);
        lockTokens.lockTokens(user1, amount, duration);

        vm.warp(block.timestamp + duration + 1);

        uint256 balanceBeforeWithdraw = token.balanceOf(user1);

        vm.prank(owner);
        lockTokens.withdrawTokens(user1);

        assertEq(token.balanceOf(user1), balanceBeforeWithdraw + amount);

        (, , , bool isWithdrawn) = lockTokens.getLockDetails(user1);
        assertTrue(isWithdrawn);
    }

    function test_onlyOwnerCanLock() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 duration = 7 days;

        vm.startPrank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user1
            )
        );
        lockTokens.lockTokens(user2, amount, duration);
        vm.stopPrank();
    }

    function test_invalidLockDuration() public {
        uint256 amount = 100 * 10 ** 18;

        vm.startPrank(owner);

        vm.expectRevert(LockTokens.InvalidLockDuration.selector);
        lockTokens.lockTokens(user1, amount, 25 seconds);

        vm.expectRevert(LockTokens.InvalidLockDuration.selector);
        lockTokens.lockTokens(user1, amount, 366 days);

        vm.stopPrank();
    }

    function test_insufficientBalance() public {
        uint256 amount = INITIAL_BALANCE + 1 ether;
        uint256 duration = 7 days;

        vm.startPrank(owner);
        vm.expectRevert(LockTokens.InsufficientBalance.selector);
        lockTokens.lockTokens(user1, amount, duration);
        vm.stopPrank();
    }

    function test_preventDoubleWithdraw() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 duration = 7 days;

        vm.prank(owner);
        lockTokens.lockTokens(user1, amount, duration);

        vm.warp(block.timestamp + duration + 1);

        vm.startPrank(owner);
        lockTokens.withdrawTokens(user1);

        vm.expectRevert(LockTokens.TokensAlreadyWithdrawn.selector);
        lockTokens.withdrawTokens(user1);
        vm.stopPrank();
    }

    function test_withdrawTokens() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 duration = 7 days;

        vm.prank(owner);
        lockTokens.lockTokens(user1, amount, duration);

        vm.warp(block.timestamp + duration + 1);

        vm.prank(owner);
        lockTokens.withdrawTokens(user1);

        uint256 balanceOfUser = token.balanceOf(user1);

        assertEq(amount, balanceOfUser);

    }

    function test_getUserDetails() public {
        uint256 amount = 100 * 10 ** 18;
        uint256 duration = 7 days;

        vm.prank(owner);
        lockTokens.lockTokens(user1, amount, duration);

        uint256 currentTime = block.timestamp;

        (
            uint256 lockedAmount,
            uint256 startLock,
            uint256 endLock,
            bool isWithdrawn
        ) = lockTokens.getLockDetails(user1);

        assertEq(lockedAmount, amount);
        assertEq(startLock, currentTime);
        assertEq(endLock, currentTime + duration);
        assertEq(isWithdrawn, false);
    }
}
