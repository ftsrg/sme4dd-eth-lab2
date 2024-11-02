// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { NftInvestmentFund } from "./NftInvestmentFund.sol";
import { FundToken } from "./FundToken.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract MallorysMaliciousMisappropriation is Ownable {
	NftInvestmentFund public nftInvestmentFund;

	constructor(address payable _nftInvestmentFundAddress) Ownable(msg.sender) {
		nftInvestmentFund = NftInvestmentFund(_nftInvestmentFundAddress);
	}
}
