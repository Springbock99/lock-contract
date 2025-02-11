pragma solidity ^0.8.25;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {TestToken} from "../contracts/TestToken.sol";

contract DeployTestToken is Script {
    function run() external returns (TestToken) {
        vm.startBroadcast();

        TestToken token = new TestToken();
        console.log("Test Token deployed at:", address(token));
        console.log("Total Supply:", token.totalSupply());

        vm.stopBroadcast();
        return token;
    }
}
