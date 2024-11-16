// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GotchaFaucet is ERC20 {
    uint256 public constant amountToDistribute = 100 * 10 ** 18;
    uint256 public constant lockTime = 1 days;
    mapping(address => uint256) public lastRequestTime;

    constructor() ERC20("TestFaucet", "TFT") {
        _mint(address(this), 10000000 * 10 ** 18); // Mint initial supply to the contract
    }

    function claimFaucet() public {
        require(
            block.timestamp >= lastRequestTime[msg.sender] + lockTime,
            unicode"You must wait 1 day before requesting more tokens"
        );
        _transfer(address(this), msg.sender, amountToDistribute);
        lastRequestTime[msg.sender] = block.timestamp;
    }
}
