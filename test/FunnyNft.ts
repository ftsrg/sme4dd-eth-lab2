import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'
import { getAddress } from 'viem'

describe('FunnyNft', function () {
    async function baseScenario() {
        const [owner, alice] = await hre.viem.getWalletClients()

        const funnyNft = await hre.viem.deployContract('FunnyNft', [], { client: { wallet: owner } })

        return { funnyNft, owner, alice }
    }

    it('Supports interface', async function () {
        const { funnyNft } = await loadFixture(baseScenario)

        // IERC721
        expect(await funnyNft.read.supportsInterface(['0x80ac58cd'])).to.equal(true)
        // IERC721Enumerable
        expect(await funnyNft.read.supportsInterface(['0x780e9d63'])).to.equal(true)
        // Non existent
        expect(await funnyNft.read.supportsInterface(['0xdeadbeef'])).to.equal(false)
    })

    it('No tokens at start', async function () {
        const { funnyNft } = await loadFixture(baseScenario)
        expect(await funnyNft.read.totalSupply()).to.equal(0n)
    })

    it('Right person minting to themselves', async function () {
        const { funnyNft, owner } = await loadFixture(baseScenario)
        expect(await funnyNft.read.totalSupply()).to.equal(0n)

        await funnyNft.write.safeMint([owner.account.address])
        expect(await funnyNft.read.ownerOf([0n])).to.equal(getAddress(owner.account.address))
        expect(await funnyNft.read.totalSupply()).to.equal(1n)
    })

    it('Right person minting to others', async function () {
        const { funnyNft, alice } = await loadFixture(baseScenario)
        expect(await funnyNft.read.totalSupply()).to.equal(0n)

        await funnyNft.write.safeMint([alice.account.address])
        expect(await funnyNft.read.ownerOf([0n])).to.equal(getAddress(alice.account.address))
        expect(await funnyNft.read.totalSupply()).to.equal(1n)
    })

    it('Wrong person minting', async function () {
        const { funnyNft, owner, alice } = await loadFixture(baseScenario)
        expect(await funnyNft.read.totalSupply()).to.equal(0n)

        await expect(
            funnyNft.write.safeMint([owner.account.address], { account: alice.account })
        ).revertedWithCustomError(funnyNft, 'OwnableUnauthorizedAccount')
        expect(await funnyNft.read.totalSupply()).to.equal(0n)
    })

    it('Token URI', async function () {
        const { funnyNft, owner } = await loadFixture(baseScenario)
        expect(await funnyNft.read.totalSupply()).to.equal(0n)

        await funnyNft.write.safeMint([owner.account.address])
        expect(await funnyNft.read.ownerOf([0n])).to.equal(getAddress(owner.account.address))
        expect(await funnyNft.read.totalSupply()).to.equal(1n)

        expect(await funnyNft.read.tokenURI([0n])).to.equal('http://localhost:5173/funny/0')
    })
})
