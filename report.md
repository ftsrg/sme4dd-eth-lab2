**THIS CHECKLIST IS NOT COMPLETE**. Use `--show-ignored-findings` to show all the results.
Summary
 - [arbitrary-send-eth](#arbitrary-send-eth) (2 results) (High)
 - [incorrect-exp](#incorrect-exp) (1 results) (High)
 - [reentrancy-eth](#reentrancy-eth) (2 results) (High)
 - [divide-before-multiply](#divide-before-multiply) (11 results) (Medium)
 - [unused-return](#unused-return) (3 results) (Medium)
 - [shadowing-local](#shadowing-local) (2 results) (Low)
 - [reentrancy-benign](#reentrancy-benign) (2 results) (Low)
 - [reentrancy-events](#reentrancy-events) (2 results) (Low)
 - [assembly](#assembly) (8 results) (Informational)
 - [pragma](#pragma) (1 results) (Informational)
 - [dead-code](#dead-code) (2 results) (Informational)
 - [solc-version](#solc-version) (2 results) (Informational)
 - [low-level-calls](#low-level-calls) (3 results) (Informational)
 - [naming-convention](#naming-convention) (1 results) (Informational)
 - [immutable-states](#immutable-states) (6 results) (Optimization)
## arbitrary-send-eth
Impact: High
Confidence: Medium
 - [ ] ID-0
[NftInvestmentFund.withdraw()](contracts/NftInvestmentFund.sol#L84-L94) sends eth to arbitrary user
	Dangerous calls:
	- [(sent,None) = address(msg.sender).call{value: withdrawAmount}()](contracts/NftInvestmentFund.sol#L87)

contracts/NftInvestmentFund.sol#L84-L94


 - [ ] ID-1
[NftInvestmentFund.buyNFT(address,uint256)](contracts/NftInvestmentFund.sol#L101-L111) sends eth to arbitrary user
	Dangerous calls:
	- [exchange.buyNFT{value: price}(listingId)](contracts/NftInvestmentFund.sol#L110)

contracts/NftInvestmentFund.sol#L101-L111


## incorrect-exp
Impact: High
Confidence: Medium
 - [ ] ID-2
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223) has bitwise-xor operator ^ instead of the exponentiation operator **: 
	 - [inverse = (3 * denominator) ^ 2](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L205)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223


## reentrancy-eth
Impact: High
Confidence: Medium
 - [ ] ID-3
Reentrancy in [NftExchange.buyNFT(uint256)](contracts/NftExchange.sol#L59-L71):
	External calls:
	- [(sent,None) = listing.seller.call{value: listing.price}()](contracts/NftExchange.sol#L64)
	- [IERC721(listing.nftContract).safeTransferFrom(address(this),msg.sender,listing.nftTokenId)](contracts/NftExchange.sol#L66)
	External calls sending eth:
	- [(sent,None) = listing.seller.call{value: listing.price}()](contracts/NftExchange.sol#L64)
	State variables written after the call(s):
	- [listing.isSold = true](contracts/NftExchange.sol#L68)
	[NftExchange.listings](contracts/NftExchange.sol#L22) can be used in cross function reentrancies:
	- [NftExchange.buyNFT(uint256)](contracts/NftExchange.sol#L59-L71)
	- [NftExchange.listings](contracts/NftExchange.sol#L22)
	- [NftExchange.sellNFT(address,uint256,uint256)](contracts/NftExchange.sol#L37-L53)

contracts/NftExchange.sol#L59-L71


 - [ ] ID-4
Reentrancy in [NftInvestmentFund.withdraw()](contracts/NftInvestmentFund.sol#L84-L94):
	External calls:
	- [(sent,None) = address(msg.sender).call{value: withdrawAmount}()](contracts/NftInvestmentFund.sol#L87)
	State variables written after the call(s):
	- [balanceAtEnd -= withdrawAmount](contracts/NftInvestmentFund.sol#L91)
	[NftInvestmentFund.balanceAtEnd](contracts/NftInvestmentFund.sol#L23) can be used in cross function reentrancies:
	- [NftInvestmentFund.balanceAtEnd](contracts/NftInvestmentFund.sol#L23)
	- [NftInvestmentFund.closeFund()](contracts/NftInvestmentFund.sol#L169-L174)
	- [NftInvestmentFund.constructor(string,string,uint256,uint256,uint256)](contracts/NftInvestmentFund.sol#L34-L54)
	- [NftInvestmentFund.withdraw()](contracts/NftInvestmentFund.sol#L84-L94)
	- [fundTokensAtEnd -= fundToken.balanceOf(msg.sender)](contracts/NftInvestmentFund.sol#L92)
	[NftInvestmentFund.fundTokensAtEnd](contracts/NftInvestmentFund.sol#L22) can be used in cross function reentrancies:
	- [NftInvestmentFund.closeFund()](contracts/NftInvestmentFund.sol#L169-L174)
	- [NftInvestmentFund.fundTokensAtEnd](contracts/NftInvestmentFund.sol#L22)
	- [NftInvestmentFund.withdraw()](contracts/NftInvestmentFund.sol#L84-L94)

contracts/NftInvestmentFund.sol#L84-L94


## divide-before-multiply
Impact: Medium
Confidence: Medium
 - [ ] ID-5
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L190)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L211)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223


 - [ ] ID-6
[Math.invMod(uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L243-L289) performs a multiplication on the result of a division:
	- [quotient = gcd / remainder](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L265)
	- [(gcd,remainder) = (remainder,gcd - remainder * quotient)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L267-L274)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L243-L289


 - [ ] ID-7
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L190)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L213)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223


 - [ ] ID-8
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L190)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L212)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223


 - [ ] ID-9
[NftInvestmentFund.withdraw()](contracts/NftInvestmentFund.sol#L84-L94) performs a multiplication on the result of a division:
	- [withdrawAmount = (balanceAtEnd / fundTokensAtEnd) * fundToken.balanceOf(msg.sender)](contracts/NftInvestmentFund.sol#L85)

contracts/NftInvestmentFund.sol#L84-L94


 - [ ] ID-10
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L190)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L214)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223


 - [ ] ID-11
[MallorysMaliciousMisappropriation.receive()](contracts/MallorysMaliciousMisappropriation.sol#L18-L31) performs a multiplication on the result of a division:
	- [withdrawAmount = (nftInvestmentFund.balanceAtEnd() / nftInvestmentFund.fundTokensAtEnd()) * tokenCount](contracts/MallorysMaliciousMisappropriation.sol#L25-L26)

contracts/MallorysMaliciousMisappropriation.sol#L18-L31


 - [ ] ID-12
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223) performs a multiplication on the result of a division:
	- [prod0 = prod0 / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L193)
	- [result = prod0 * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L220)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223


 - [ ] ID-13
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L190)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L210)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223


 - [ ] ID-14
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L190)
	- [inverse *= 2 - denominator * inverse](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L209)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223


 - [ ] ID-15
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223) performs a multiplication on the result of a division:
	- [denominator = denominator / twos](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L190)
	- [inverse = (3 * denominator) ^ 2](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L205)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223


## unused-return
Impact: Medium
Confidence: Medium
 - [ ] ID-16
[MallorysMaliciousMisappropriation.attack()](contracts/MallorysMaliciousMisappropriation.sol#L39-L43) ignores return value by [FundToken(nftInvestmentFund.fundToken()).approve(address(nftInvestmentFund),tokenCount)](contracts/MallorysMaliciousMisappropriation.sol#L41)

contracts/MallorysMaliciousMisappropriation.sol#L39-L43


 - [ ] ID-17
[NftInvestmentFund.registerNFTSale(uint256)](contracts/NftInvestmentFund.sol#L155-L166) ignores return value by [(None,nftContract,nftTokenId,None,None,isSold) = exchange.listings(activeListing.listingId)](contracts/NftInvestmentFund.sol#L160)

contracts/NftInvestmentFund.sol#L155-L166


 - [ ] ID-18
[NftInvestmentFund.buyNFT(address,uint256)](contracts/NftInvestmentFund.sol#L101-L111) ignores return value by [(None,None,None,None,price,None) = exchange.listings(listingId)](contracts/NftInvestmentFund.sol#L107)

contracts/NftInvestmentFund.sol#L101-L111


## shadowing-local
Impact: Low
Confidence: High
 - [ ] ID-19
[FundToken.constructor(address,string,string).symbol](contracts/FundToken.sol#L13) shadows:
	- [ERC20.symbol()](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L61-L63) (function)
	- [IERC20Metadata.symbol()](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L20) (function)

contracts/FundToken.sol#L13


 - [ ] ID-20
[FundToken.constructor(address,string,string).name](contracts/FundToken.sol#L12) shadows:
	- [ERC20.name()](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L53-L55) (function)
	- [IERC20Metadata.name()](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L15) (function)

contracts/FundToken.sol#L12


## reentrancy-benign
Impact: Low
Confidence: Medium
 - [ ] ID-21
Reentrancy in [NftExchange.sellNFT(address,uint256,uint256)](contracts/NftExchange.sol#L37-L53):
	External calls:
	- [IERC721(nftContract).safeTransferFrom(msg.sender,address(this),nftTokenId)](contracts/NftExchange.sol#L38)
	State variables written after the call(s):
	- [listingId = _nextListingId ++](contracts/NftExchange.sol#L40)
	- [listings[listingId] = Listing({listingId:listingId,nftContract:nftContract,nftTokenId:nftTokenId,seller:address(msg.sender),price:price,isSold:false})](contracts/NftExchange.sol#L42-L49)

contracts/NftExchange.sol#L37-L53


 - [ ] ID-22
Reentrancy in [NftInvestmentFund.sellNFT(address,address,uint256,uint256)](contracts/NftInvestmentFund.sol#L138-L152):
	External calls:
	- [IERC721(nftContract).approve(nftExchangeAddress,nftTokenId)](contracts/NftInvestmentFund.sol#L147)
	- [listingId = exchange.sellNFT(nftContract,nftTokenId,price)](contracts/NftInvestmentFund.sol#L149)
	State variables written after the call(s):
	- [activeListings.push(ActiveListing({nftExchangeAddress:nftExchangeAddress,listingId:listingId}))](contracts/NftInvestmentFund.sol#L151)

contracts/NftInvestmentFund.sol#L138-L152


## reentrancy-events
Impact: Low
Confidence: Medium
 - [ ] ID-23
Reentrancy in [NftExchange.sellNFT(address,uint256,uint256)](contracts/NftExchange.sol#L37-L53):
	External calls:
	- [IERC721(nftContract).safeTransferFrom(msg.sender,address(this),nftTokenId)](contracts/NftExchange.sol#L38)
	Event emitted after the call(s):
	- [NftOffered(listingId,nftContract,nftTokenId,msg.sender,price)](contracts/NftExchange.sol#L51)

contracts/NftExchange.sol#L37-L53


 - [ ] ID-24
Reentrancy in [NftExchange.buyNFT(uint256)](contracts/NftExchange.sol#L59-L71):
	External calls:
	- [(sent,None) = listing.seller.call{value: listing.price}()](contracts/NftExchange.sol#L64)
	- [IERC721(listing.nftContract).safeTransferFrom(address(this),msg.sender,listing.nftTokenId)](contracts/NftExchange.sol#L66)
	External calls sending eth:
	- [(sent,None) = listing.seller.call{value: listing.price}()](contracts/NftExchange.sol#L64)
	Event emitted after the call(s):
	- [NftSold(listingId,msg.sender)](contracts/NftExchange.sol#L70)

contracts/NftExchange.sol#L59-L71


## assembly
Impact: Informational
Confidence: High
 - [ ] ID-25
[SafeCast.toUint(bool)](node_modules/@openzeppelin/contracts/utils/math/SafeCast.sol#L1157-L1161) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/SafeCast.sol#L1158-L1160)

node_modules/@openzeppelin/contracts/utils/math/SafeCast.sol#L1157-L1161


 - [ ] ID-26
[Math.tryModExp(bytes,bytes,bytes)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L377-L399) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L389-L398)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L377-L399


 - [ ] ID-27
[ERC721Utils.checkOnERC721Received(address,address,address,uint256,bytes)](node_modules/@openzeppelin/contracts/token/ERC721/utils/ERC721Utils.sol#L25-L49) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/token/ERC721/utils/ERC721Utils.sol#L43-L45)

node_modules/@openzeppelin/contracts/token/ERC721/utils/ERC721Utils.sol#L25-L49


 - [ ] ID-28
[Panic.panic(uint256)](node_modules/@openzeppelin/contracts/utils/Panic.sol#L50-L56) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Panic.sol#L51-L55)

node_modules/@openzeppelin/contracts/utils/Panic.sol#L50-L56


 - [ ] ID-29
[Math.tryModExp(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L337-L361) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L339-L360)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L337-L361


 - [ ] ID-30
[Math.mulDiv(uint256,uint256,uint256)](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L151-L154)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L175-L182)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L188-L197)

node_modules/@openzeppelin/contracts/utils/math/Math.sol#L144-L223


 - [ ] ID-31
[Strings.toString(uint256)](node_modules/@openzeppelin/contracts/utils/Strings.sol#L24-L42) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L29-L31)
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L34-L36)

node_modules/@openzeppelin/contracts/utils/Strings.sol#L24-L42


 - [ ] ID-32
[Strings.toChecksumHexString(address)](node_modules/@openzeppelin/contracts/utils/Strings.sol#L90-L108) uses assembly
	- [INLINE ASM](node_modules/@openzeppelin/contracts/utils/Strings.sol#L95-L97)

node_modules/@openzeppelin/contracts/utils/Strings.sol#L90-L108


## pragma
Impact: Informational
Confidence: High
 - [ ] ID-33
2 different versions of Solidity are used:
	- Version constraint ^0.8.20 is used by:
		-[^0.8.20](node_modules/@openzeppelin/contracts/access/AccessControl.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/access/IAccessControl.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/access/Ownable.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/utils/ERC721Utils.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/Context.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/Panic.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/Pausable.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/Strings.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L4)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/math/SafeCast.sol#L5)
		-[^0.8.20](node_modules/@openzeppelin/contracts/utils/math/SignedMath.sol#L4)
	- Version constraint ^0.8.22 is used by:
		-[^0.8.22](contracts/FundToken.sol#L3)
		-[^0.8.22](contracts/FunnyNft.sol#L3)
		-[^0.8.22](contracts/MallorysMaliciousMisappropriation.sol#L2)
		-[^0.8.22](contracts/NftExchange.sol#L3)
		-[^0.8.22](contracts/NftInvestmentFund.sol#L3)
		-[^0.8.22](contracts/UniqueNft.sol#L3)

node_modules/@openzeppelin/contracts/access/AccessControl.sol#L4


## dead-code
Impact: Informational
Confidence: Medium
 - [ ] ID-34
[FunnyNft._increaseBalance(address,uint128)](contracts/FunnyNft.sol#L33-L35) is never used and should be removed

contracts/FunnyNft.sol#L33-L35


 - [ ] ID-35
[UniqueNft._increaseBalance(address,uint128)](contracts/UniqueNft.sol#L27-L29) is never used and should be removed

contracts/UniqueNft.sol#L27-L29


## solc-version
Impact: Informational
Confidence: High
 - [ ] ID-36
Version constraint ^0.8.20 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- VerbatimInvalidDeduplication
	- FullInlinerNonExpressionSplitArgumentEvaluationOrder
	- MissingSideEffectsOnSelectorAccess.
It is used by:
	- [^0.8.20](node_modules/@openzeppelin/contracts/access/AccessControl.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/access/IAccessControl.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/access/Ownable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/interfaces/draft-IERC6093.sol#L3)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/token/ERC721/utils/ERC721Utils.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/Context.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/Panic.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/Pausable.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/Strings.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/math/Math.sol#L4)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/math/SafeCast.sol#L5)
	- [^0.8.20](node_modules/@openzeppelin/contracts/utils/math/SignedMath.sol#L4)

node_modules/@openzeppelin/contracts/access/AccessControl.sol#L4


 - [ ] ID-37
Version constraint ^0.8.22 contains known severe issues (https://solidity.readthedocs.io/en/latest/bugs.html)
	- VerbatimInvalidDeduplication.
It is used by:
	- [^0.8.22](contracts/FundToken.sol#L3)
	- [^0.8.22](contracts/FunnyNft.sol#L3)
	- [^0.8.22](contracts/MallorysMaliciousMisappropriation.sol#L2)
	- [^0.8.22](contracts/NftExchange.sol#L3)
	- [^0.8.22](contracts/NftInvestmentFund.sol#L3)
	- [^0.8.22](contracts/UniqueNft.sol#L3)

contracts/FundToken.sol#L3


## low-level-calls
Impact: Informational
Confidence: High
 - [ ] ID-38
Low level call in [MallorysMaliciousMisappropriation.withdraw()](contracts/MallorysMaliciousMisappropriation.sol#L45-L48):
	- [(sent,None) = address(msg.sender).call{value: address(this).balance}()](contracts/MallorysMaliciousMisappropriation.sol#L46)

contracts/MallorysMaliciousMisappropriation.sol#L45-L48


 - [ ] ID-39
Low level call in [NftExchange.buyNFT(uint256)](contracts/NftExchange.sol#L59-L71):
	- [(sent,None) = listing.seller.call{value: listing.price}()](contracts/NftExchange.sol#L64)

contracts/NftExchange.sol#L59-L71


 - [ ] ID-40
Low level call in [NftInvestmentFund.withdraw()](contracts/NftInvestmentFund.sol#L84-L94):
	- [(sent,None) = address(msg.sender).call{value: withdrawAmount}()](contracts/NftInvestmentFund.sol#L87)

contracts/NftInvestmentFund.sol#L84-L94


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-41
Parameter [NftInvestmentFund.invest(uint256)._tokenCount](contracts/NftInvestmentFund.sol#L76) is not in mixedCase

contracts/NftInvestmentFund.sol#L76


## immutable-states
Impact: Optimization
Confidence: High
 - [ ] ID-42
[NftInvestmentFund.pricePerToken](contracts/NftInvestmentFund.sol#L17) should be immutable 

contracts/NftInvestmentFund.sol#L17


 - [ ] ID-43
[MallorysMaliciousMisappropriation.nftInvestmentFund](contracts/MallorysMaliciousMisappropriation.sol#L9) should be immutable 

contracts/MallorysMaliciousMisappropriation.sol#L9


 - [ ] ID-44
[NftInvestmentFund.fundToken](contracts/NftInvestmentFund.sol#L16) should be immutable 

contracts/NftInvestmentFund.sol#L16


 - [ ] ID-45
[NftInvestmentFund.investmentEnd](contracts/NftInvestmentFund.sol#L20) should be immutable 

contracts/NftInvestmentFund.sol#L20


 - [ ] ID-46
[NftInvestmentFund.fundingEnd](contracts/NftInvestmentFund.sol#L19) should be immutable 

contracts/NftInvestmentFund.sol#L19


 - [ ] ID-47
[NftInvestmentFund.fundManager](contracts/NftInvestmentFund.sol#L13) should be immutable 

contracts/NftInvestmentFund.sol#L13


