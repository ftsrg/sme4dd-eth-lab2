// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./FundToken.sol";
import "./NftExchange.sol";

contract NftInvestmentFund is AccessControl, IERC721Receiver {
	bytes32 public constant FUND_MANAGER_ROLE = keccak256("FUND_MANAGER");

	address public fundManager;

	string public name;
	FundToken public fundToken;
	uint public pricePerToken;

	uint public fundingEnd;
	uint public investmentEnd;
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

	constructor(
		string memory _name,
		string memory _symbol,
		uint _pricePerToken,
		uint _fundingEnd,
		uint _investmentEnd
	) {
		require(_investmentEnd > _fundingEnd);

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

	modifier onlyBefore(uint time) {
		require(block.timestamp < time, "Too late");
		_;
	}

	modifier onlyAfter(uint time) {
		require(block.timestamp > time, "Too early");
		_;
	}

	modifier onlyEnded() {
		require(ended, "Not ended");
		_;
	}

	/****************************************
	 * Investors                            *
	 ****************************************/

	// Inverstor buys tokens
	function invest(uint _tokenCount) external payable onlyBefore(fundingEnd) {
		require(msg.value >= _tokenCount * pricePerToken, "Insuffisient funds sent");

		// Mint tokens that represent their investment
		fundToken.mint(msg.sender, _tokenCount);
	}

	// Refund based on token balance at the end
	function withdraw() external onlyEnded {
		if (balanceAtEnd > 0 && fundTokensAtEnd > 0 && fundToken.balanceOf(msg.sender) > 0) {
			uint256 withdrawAmount = (balanceAtEnd / fundTokensAtEnd) * fundToken.balanceOf(msg.sender);

			(bool sent, ) = payable(msg.sender).call{ value: withdrawAmount }("");
			require(sent, "Failed to send Ether");

			// Their tokens are burnt so that they cannot withdraw twice
			balanceAtEnd -= withdrawAmount;
			fundTokensAtEnd -= fundToken.balanceOf(msg.sender);
			fundToken.burnFrom(msg.sender, fundToken.balanceOf(msg.sender));
		}
	}

	/****************************************
	 * Fund manager                         *
	 ****************************************/

	// Buy NFT listing at exchange
	function buyNFT(
		address nftExchangeAddress,
		uint listingId
	) external onlyAfter(fundingEnd) onlyBefore(investmentEnd) onlyRole(FUND_MANAGER_ROLE) {
		NftExchange exchange = NftExchange(nftExchangeAddress);

		(, , , , uint256 price, ) = exchange.listings(listingId);
		require(address(this).balance >= price, "Insuffisient funds");

		exchange.buyNFT{ value: price }(listingId);
	}

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
		for (uint i = 0; i < activeListings.length; ) {
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
		for (uint i = 0; i < tokenIds.length; i++) {
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
		for (uint j = 0; j < ownedNftAddresses.length; j++) {
			if (ownedNftAddresses[j] == nftContract) {
				ownedNftAddresses[j] = ownedNftAddresses[ownedNftAddresses.length - 1];
				ownedNftAddresses.pop();
				break;
			}
		}
	}
}
