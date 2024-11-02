// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract NftExchange is Pausable, Ownable, IERC721Receiver {
	uint256 private _nextListingId;

	struct Listing {
		uint256 listingId;
		address nftContract;
		uint256 nftTokenId;
		address payable seller;
		uint256 price;
		bool isSold;
	}

	mapping(uint256 => Listing) public listings;

	event NftOffered(uint256 listingId, address nftContract, uint256 tokenId, address seller, uint256 price);
	event NftSold(uint256 listingId, address buyer);

	constructor() Ownable(msg.sender) {}

	function pause() public onlyOwner {
		_pause();
	}

	function unpause() public onlyOwner {
		_unpause();
	}

	function sellNFT(address nftContract, uint256 nftTokenId, uint256 price) public whenNotPaused returns (uint256) {
		IERC721(nftContract).safeTransferFrom(msg.sender, address(this), nftTokenId);

		uint256 listingId = _nextListingId++;

		listings[listingId] = Listing({
			listingId: listingId,
			nftContract: nftContract,
			nftTokenId: nftTokenId,
			seller: payable(msg.sender),
			price: price,
			isSold: false
		});

		emit NftOffered(listingId, nftContract, nftTokenId, msg.sender, price);
		return listingId;
	}

	function numberOfListings() public view returns (uint256) {
		return _nextListingId;
	}

	function buyNFT(uint256 listingId) public payable whenNotPaused {
		Listing storage listing = listings[listingId];
		require(!listing.isSold, "NFT is already sold");
		require(msg.value >= listing.price, "Insufficient funds");

		(bool sent, ) = listing.seller.call{ value: listing.price }("");
		require(sent, "Not transferred");
		IERC721(listing.nftContract).safeTransferFrom(address(this), msg.sender, listing.nftTokenId);

		listing.isSold = true;

		emit NftSold(listingId, msg.sender);
	}

	function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
		return IERC721Receiver.onERC721Received.selector;
	}
}
