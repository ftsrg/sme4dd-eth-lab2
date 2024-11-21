// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FundToken is ERC20, ERC20Burnable, Ownable {
	constructor(
		address initialOwner,
		string memory name,
		string memory symbol
	) ERC20(name, symbol) Ownable(initialOwner) {}

	function mint(address to, uint256 amount) public onlyOwner {
		_mint(to, amount);
	}
}