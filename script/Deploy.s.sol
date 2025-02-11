
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {LockTokens} from "../contracts/LockTokens.sol";
import {TestToken} from "../contracts/TestToken.sol";

contract DeployLockTokens is Script {
    function run() external returns (LockTokens) {
        // Start broadcasting transactions
        vm.startBroadcast();

        // Deploy the contract with the token address
        TestToken token = new TestToken();

        LockTokens lockTokens = new LockTokens(
            address(token)
        );

        console.log("Lock Contract deployed at:", address(lockTokens));
        console.log("Token Address:", address(lockTokens.token()));
        vm.stopBroadcast();
        return lockTokens;
    }
}