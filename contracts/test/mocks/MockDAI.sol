// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockDAI is ERC20 {
    constructor() ERC20("Mock DAI", "DAI") {
        _mint(msg.sender, 1_000_000 * 10**18); // 1M DAI pour tests
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}