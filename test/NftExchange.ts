import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'
import { getAddress } from 'viem'

describe('NFT Exchange', function () {
    async function baseScenario() {
        const [owner, alice] = await hre.viem.getWalletClients()

        const nftExchange = await hre.viem.deployContract('NftExchange', [], {
            client: { wallet: owner }
        })

        const nft = await hre.viem.deployContract('UniqueNft', [], {
            client: { wallet: owner }
        })

        return { nftExchange, nft, owner, alice }
    }

    async function offeredNftScenario() {
        const [owner, alice] = await hre.viem.getWalletClients()

        const nftExchange = await hre.viem.deployContract('NftExchange', [], {
            client: { wallet: owner }
        })

        const nft = await hre.viem.deployContract('UniqueNft', [], {
            client: { wallet: owner }
        })

        await nft.write.approve([nftExchange.address, 0n])
        await nftExchange.write.sellNFT([nft.address, 0n, 200n])

        return { nftExchange, nft, owner, alice }
    }

    it('Creation', async function () {
        const { nftExchange, owner } = await loadFixture(baseScenario)
        expect(await nftExchange.read.owner()).to.equal(getAddress(owner.account.address))
        expect(await nftExchange.read.numberOfListings()).to.equal(0n)
    })

    it('Sell owned and approved NFT', async function () {
        const { nftExchange, nft, owner } = await loadFixture(baseScenario)
        expect(await nftExchange.read.owner()).to.equal(getAddress(owner.account.address))
        expect(await nftExchange.read.numberOfListings()).to.equal(0n)
        expect(await nft.read.ownerOf([0n])).to.equal(getAddress(owner.account.address))

        await nft.write.approve([nftExchange.address, 0n])

        const { result: sellResult, request: sellRequest } = await nftExchange.simulate.sellNFT(
            [nft.address, 0n, 200n],
            {
                account: owner.account.address
            }
        )
        expect(sellResult).to.equal(0n)
        expect(await owner.writeContract(sellRequest)).to.emit(nftExchange, 'NftOffered')

        expect(await nftExchange.read.numberOfListings()).to.equal(1n)

        const [listingId, nftContract, nftTokenId, seller, price, isSold] = await nftExchange.read.listings([0n])
        expect(listingId).to.equal(0n)
        expect(nftContract).to.equal(getAddress(nft.address))
        expect(nftTokenId).to.equal(0n)
        expect(seller).to.equal(getAddress(owner.account.address))
        expect(price).to.equal(200n)
        expect(isSold).to.equal(false)

        expect(await nft.read.ownerOf([0n])).to.equal(getAddress(nftExchange.address))
    })

    it('Sell not approved NFT', async function () {
        const { nftExchange, nft, owner } = await loadFixture(baseScenario)
        expect(await nftExchange.read.owner()).to.equal(getAddress(owner.account.address))
        expect(await nftExchange.read.numberOfListings()).to.equal(0n)
        expect(await nft.read.ownerOf([0n])).to.equal(getAddress(owner.account.address))

        await expect(
            nftExchange.write.sellNFT([nft.address, 0n, 200n], {
                account: owner.account.address
            })
        ).to.revertedWithCustomError(nft, 'ERC721InsufficientApproval')
    })

    it('Sell while paused', async function () {
        const { nftExchange, nft, owner } = await loadFixture(baseScenario)
        expect(await nftExchange.read.numberOfListings()).to.equal(0n)

        await nftExchange.write.pause()
        await expect(
            nftExchange.write.sellNFT([nft.address, 0n, 200n], {
                account: owner.account.address
            })
        ).to.revertedWithCustomError(nftExchange, 'EnforcedPause')
    })

    it('Sell after unpause', async function () {
        const { nftExchange, nft, owner } = await loadFixture(baseScenario)
        expect(await nftExchange.read.numberOfListings()).to.equal(0n)
        expect(await nft.read.ownerOf([0n])).to.equal(getAddress(owner.account.address))

        await nft.write.approve([nftExchange.address, 0n])

        await nftExchange.write.pause()
        await expect(
            nftExchange.write.sellNFT([nft.address, 0n, 200n], {
                account: owner.account.address
            })
        ).to.revertedWithCustomError(nftExchange, 'EnforcedPause')

        await nftExchange.write.unpause()
        await nftExchange.write.sellNFT([nft.address, 0n, 200n], {
            account: owner.account.address
        })
    })

    it('Buy NFT', async function () {
        const { nftExchange, nft, owner, alice } = await loadFixture(offeredNftScenario)
        expect(await nftExchange.read.numberOfListings()).to.equal(1n)
        expect(await nft.read.ownerOf([0n])).to.equal(getAddress(nftExchange.address))

        const [preListingId, preNftContract, preNftTokenId, preSeller, prePrice, preIsSold] =
            await nftExchange.read.listings([0n])
        expect(preListingId).to.equal(0n)
        expect(preNftContract).to.equal(getAddress(nft.address))
        expect(preNftTokenId).to.equal(0n)
        expect(preSeller).to.equal(getAddress(owner.account.address))
        expect(prePrice).to.equal(200n)
        expect(preIsSold).to.equal(false)

        const tx = await nftExchange.write.buyNFT([0n], { account: alice.account, value: 200n })
        expect(tx).to.emit(nftExchange, 'NftSold')
        expect(tx).to.changeEtherBalances([owner.account, nftExchange.address, alice.account], [200n, 0n, -200n])

        expect(await nft.read.ownerOf([0n])).to.equal(getAddress(alice.account.address))
        expect(await nftExchange.read.numberOfListings()).to.equal(1n)

        const [postListingId, postNftContract, postNftTokenId, postSeller, postPrice, postIsSold] =
            await nftExchange.read.listings([0n])
        expect(postListingId).to.equal(0n)
        expect(postNftContract).to.equal(getAddress(nft.address))
        expect(postNftTokenId).to.equal(0n)
        expect(postSeller).to.equal(getAddress(owner.account.address))
        expect(postPrice).to.equal(200n)
        expect(postIsSold).to.equal(true)
    })

    it('Buy already sold NFT', async function () {
        const { nftExchange, nft, alice } = await loadFixture(offeredNftScenario)
        expect(await nftExchange.read.numberOfListings()).to.equal(1n)
        expect(await nft.read.ownerOf([0n])).to.equal(getAddress(nftExchange.address))

        await nftExchange.write.buyNFT([0n], { account: alice.account, value: 200n })

        await expect(
            nftExchange.write.buyNFT([0n], { account: alice.account, value: 200n })
        ).to.revertedWithCustomError(nftExchange, 'NFTAlreadySold')
    })

    it('Buy with insufficient funds NFT', async function () {
        const { nftExchange, nft, alice } = await loadFixture(offeredNftScenario)
        expect(await nftExchange.read.numberOfListings()).to.equal(1n)
        expect(await nft.read.ownerOf([0n])).to.equal(getAddress(nftExchange.address))

        await expect(
            nftExchange.write.buyNFT([0n], { account: alice.account, value: 100n })
        ).to.revertedWithCustomError(nftExchange, 'InsufficientFunds')
    })

    it('Buy nonexistent listing', async function () {
        const { nftExchange, nft, alice } = await loadFixture(offeredNftScenario)
        expect(await nftExchange.read.numberOfListings()).to.equal(1n)
        expect(await nft.read.ownerOf([0n])).to.equal(getAddress(nftExchange.address))

        await expect(nftExchange.write.buyNFT([3n], { account: alice.account, value: 100n })).to.revertedWithoutReason()
    })

    it('Buy while paused', async function () {
        const { nftExchange, nft, alice } = await loadFixture(offeredNftScenario)
        expect(await nftExchange.read.numberOfListings()).to.equal(1n)
        expect(await nft.read.ownerOf([0n])).to.equal(getAddress(nftExchange.address))

        await nftExchange.write.pause()
        await expect(
            nftExchange.write.buyNFT([0n], { account: alice.account, value: 200n })
        ).to.revertedWithCustomError(nftExchange, 'EnforcedPause')
    })

    it('Buy after unpause', async function () {
        const { nftExchange, nft, alice } = await loadFixture(offeredNftScenario)
        expect(await nftExchange.read.numberOfListings()).to.equal(1n)
        expect(await nft.read.ownerOf([0n])).to.equal(getAddress(nftExchange.address))

        await nftExchange.write.pause()
        await expect(
            nftExchange.write.buyNFT([0n], { account: alice.account, value: 200n })
        ).to.revertedWithCustomError(nftExchange, 'EnforcedPause')

        await nftExchange.write.unpause()
        await nftExchange.write.buyNFT([0n], { account: alice.account, value: 200n })
    })

    it('Wrong owner pauses and unpauses', async function () {
        const { nftExchange, nft, alice } = await loadFixture(offeredNftScenario)

        expect(await nftExchange.read.paused()).to.equal(false)
        await expect(nftExchange.write.pause({ account: alice.account })).to.revertedWithCustomError(
            nftExchange,
            'OwnableUnauthorizedAccount'
        )

        await nftExchange.write.pause()

        expect(await nftExchange.read.paused()).to.equal(true)
        await expect(nftExchange.write.unpause({ account: alice.account })).to.revertedWithCustomError(
            nftExchange,
            'OwnableUnauthorizedAccount'
        )

        await nftExchange.write.unpause()
        expect(await nftExchange.read.paused()).to.equal(false)
    })
})
