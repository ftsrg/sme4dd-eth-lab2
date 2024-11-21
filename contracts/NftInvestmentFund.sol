// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { IERC721 } from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import { FundToken } from "./FundToken.sol";
import { NftExchange } from "./NftExchange.sol";

contract NftInvestmentFund is AccessControl, IERC721Receiver {
	bytes32 public constant FUND_MANAGER_ROLE = keccak256("FUND_MANAGER");
	address public fundManager;

	string public name;
	FundToken public fundToken;
	uint256 public pricePerToken;

	uint256 public fundingEnd;
	uint256 public investmentEnd;
	bool public ended;
	uint256 public fundTokensAtEnd;
	uint256 public balanceAtEnd;

	address[] public ownedNftAddresses;
	mapping(address => uint[]) public ownedNftTokenIds;

	struct ActiveListing {
		address nftExchangeAddress;
		uint256 listingId;
	}
	ActiveListing[] public activeListings;

	error InvestmentAfterFunding();
	error TooEarly();
	error TooLate();
	error NotEnded();

	constructor(
		string memory _name,
		string memory _symbol,
		uint256 _pricePerToken,
		uint256 _fundingEnd,
		uint256 _investmentEnd
	) {
		if (_investmentEnd <= _fundingEnd) revert InvestmentAfterFunding();

		fundManager = msg.sender;
		_grantRole(FUND_MANAGER_ROLE, fundManager);

		name = _name;
		fundToken = new FundToken(address(this), string.concat(_name, " Token"), _symbol);
		pricePerToken = _pricePerToken;

		fundingEnd = _fundingEnd;
		investmentEnd = _investmentEnd;
		ended = false;
		balanceAtEnd = 0;
	}

	modifier onlyBefore(uint256 time) {
		if (block.timestamp > time) revert TooLate();
		_;
	}

	modifier onlyAfter(uint256 time) {
		if (block.timestamp < time) revert TooEarly();
		_;
	}

	modifier onlyEnded() {
		if (!ended) revert NotEnded();
		_;
	}

	/****************************************
	 * Investors                            *
	 ****************************************/

	// Inverstor buys tokens
	function invest(uint256 _tokenCount) external payable onlyBefore(fundingEnd) {
		require(msg.value >= _tokenCount * pricePerToken, "Insuffisient funds sent");

		// Mint tokens that represent their investment
		fundToken.mint(msg.sender, _tokenCount);
	}

	// Refund based on token balance at the end
	function withdraw() external onlyEnded {
		if (balanceAtEnd > 0 && fundTokensAtEnd > 0 && fundToken.balanceOf(msg.sender) > 0) {
			uint256 withdrawAmount = (balanceAtEnd / fundTokensAtEnd) * fundToken.balanceOf(msg.sender);

			// Their tokens are burnt so that they cannot withdraw twice
			balanceAtEnd -= withdrawAmount;
			fundTokensAtEnd -= fundToken.balanceOf(msg.sender);
			fundToken.burnFrom(msg.sender, fundToken.balanceOf(msg.sender));

			(bool sent, ) = payable(msg.sender).call{ value: withdrawAmount }("");
			require(sent, "Failed to send Ether");
		}
	}

	/****************************************
	 * Fund manager                         *
	 ****************************************/

	// Buy NFT listing at exchange
	function buyNFT(
		address nftExchangeAddress,
		uint256 listingId
	) external onlyAfter(fundingEnd) onlyBefore(investmentEnd) onlyRole(FUND_MANAGER_ROLE) {
		NftExchange exchange = NftExchange(nftExchangeAddress);

		(, , , , uint256 price, ) = exchange.listings(listingId);
		require(address(this).balance >= price, "Insuffisient funds");

		exchange.buyNFT{ value: price }(listingId);
	}

	// Register NFT not transferred via safeTransferFrom
	function registerNFT(
		address nftAddress,
		uint256 nftTokenId
	) external onlyAfter(fundingEnd) onlyBefore(investmentEnd) onlyRole(FUND_MANAGER_ROLE) {
		ownedNftAddresses.push(nftAddress);
		ownedNftTokenIds[nftAddress].push(nftTokenId);
	}

	// Sell NFT
	function sellNFT(
		address nftExchangeAddress,
		address nftAddress,
		uint256 tokenIndex,
		uint256 price
	) external onlyAfter(fundingEnd) onlyRole(FUND_MANAGER_ROLE) {
		require(ownedNftTokenIds[nftAddress].length > tokenIndex, "Non-existent token");
		uint256 nftTokenId = ownedNftTokenIds[nftAddress][tokenIndex];

		IERC721(nftAddress).approve(nftExchangeAddress, nftTokenId);
		NftExchange exchange = NftExchange(nftExchangeAddress);
		uint256 listingId = exchange.sellNFT(nftAddress, nftTokenId, price);

		activeListings.push(ActiveListing({ nftExchangeAddress: nftExchangeAddress, listingId: listingId }));

		_removeNFTToken(nftAddress, nftTokenId);
	}

	// Register NFT sales
	function registerNFTSales() public onlyAfter(fundingEnd) onlyRole(FUND_MANAGER_ROLE) {
		for (uint256 i = 0; i < activeListings.length; ) {
			ActiveListing memory activeListing = activeListings[i];

			NftExchange exchange = NftExchange(activeListing.nftExchangeAddress);
			(, , , , , bool isSold) = exchange.listings(activeListing.listingId);

			if (isSold) {
				activeListings[i] = activeListings[activeListings.length - 1];
				activeListings.pop();
			} else {
				i++;
			}
		}
	}

	// Close the fund after the end
	function closeFund() external onlyAfter(investmentEnd) onlyRole(FUND_MANAGER_ROLE) {
		require(ownedNftAddresses.length == 0, "Not all NFT is sold");
		if (activeListings.length > 0) {
			registerNFTSales();
		}
		require(activeListings.length == 0, "Not all NFT sale went through");

		ended = true;
		fundTokensAtEnd = fundToken.totalSupply();
		balanceAtEnd = address(this).balance;
	}

	/****************************************
	 * Helpers                              *
	 ****************************************/

	receive() external payable {}

	// Handle receiving NFT
	function onERC721Received(
		address,
		address,
		uint256 tokenId,
		bytes calldata
	) external onlyAfter(fundingEnd) onlyBefore(investmentEnd) returns (bytes4) {
		if (ownedNftTokenIds[msg.sender].length == 0) {
			ownedNftAddresses.push(msg.sender);
		}
		ownedNftTokenIds[msg.sender].push(tokenId);

		return IERC721Receiver.onERC721Received.selector;
	}

	function ownedNftAddressesCount() external view returns (uint256) {
		return ownedNftAddresses.length;
	}

	function ownedNftTokenIdsCount(address nftAddress) external view returns (uint256) {
		return ownedNftTokenIds[nftAddress].length;
	}

	function activeListingsCount() external view returns (uint256) {
		return activeListings.length;
	}

	function _removeNFTToken(address nftContract, uint256 nftTokenId) private {
		uint256[] storage tokenIds = ownedNftTokenIds[nftContract];
		for (uint256 i = 0; i < tokenIds.length; i++) {
			if (tokenIds[i] == nftTokenId) {
				tokenIds[i] = tokenIds[tokenIds.length - 1];
				tokenIds.pop();

				if (tokenIds.length == 0) {
					_removeNFTContract(nftContract);
				}

				break;
			}
		}
	}

	function _removeNFTContract(address nftContract) private {
		for (uint256 j = 0; j < ownedNftAddresses.length; j++) {
			if (ownedNftAddresses[j] == nftContract) {
				ownedNftAddresses[j] = ownedNftAddresses[ownedNftAddresses.length - 1];
				ownedNftAddresses.pop();
				break;
			}
		}
	}
}
