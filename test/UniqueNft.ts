import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'
import { getAddress } from 'viem'

describe('UniqueNft', function () {
    async function baseScenario() {
        const [owner, alice] = await hre.viem.getWalletClients()

        const uniqueNft = await hre.viem.deployContract('UniqueNft', [], { client: { wallet: owner } })

        return { uniqueNft, owner, alice }
    }

    it('Supports interface', async function () {
        const { uniqueNft } = await loadFixture(baseScenario)

        // IERC721
        expect(await uniqueNft.read.supportsInterface(['0x80ac58cd'])).to.equal(true)
        // IERC721Enumerable
        expect(await uniqueNft.read.supportsInterface(['0x780e9d63'])).to.equal(true)
        // Non existent
        expect(await uniqueNft.read.supportsInterface(['0xdeadbeef'])).to.equal(false)
    })

    it('Token at owner at start', async function () {
        const { uniqueNft, owner } = await loadFixture(baseScenario)
        expect(await uniqueNft.read.ownerOf([0n])).to.equal(getAddress(owner.account.address))
        expect(await uniqueNft.read.totalSupply()).to.equal(1n)
    })

    it('Token URI', async function () {
        const { uniqueNft, owner } = await loadFixture(baseScenario)
        expect(await uniqueNft.read.ownerOf([0n])).to.equal(getAddress(owner.account.address))
        expect(await uniqueNft.read.totalSupply()).to.equal(1n)

        expect(await uniqueNft.read.tokenURI([0n])).to.equal('http://localhost:5173/unique/0')
    })
})
