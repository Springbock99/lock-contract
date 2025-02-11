// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {

    constructor() ERC20("Test Token", "TEST") {
        // Mint 1 million tokens to the deployer
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    function mint (address to, uint amount) external {
        _mint(to, amount);
    }
}