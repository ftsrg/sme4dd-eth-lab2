import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'
import { getAddress } from 'viem'

describe('FundToken', function () {
    async function baseScenario() {
        const [owner, alice] = await hre.viem.getWalletClients()

        const fundToken = await hre.viem.deployContract('FundToken', [owner.account.address, 'FundToken', 'FT'], {
            client: { wallet: owner }
        })

        return { fundToken, owner, alice }
    }

    it('Initial owner', async function () {
        const { fundToken, owner } = await loadFixture(baseScenario)

        expect(await fundToken.read.owner()).to.equal(getAddress(owner.account.address))
    })

    it('Name and symbol', async function () {
        const { fundToken } = await loadFixture(baseScenario)

        expect(await fundToken.read.name()).to.equal('FundToken')
        expect(await fundToken.read.symbol()).to.equal('FT')
    })

    it('No tokens at start', async function () {
        const { fundToken } = await loadFixture(baseScenario)
        expect(await fundToken.read.totalSupply()).to.equal(0n)
    })

    it('Right person minting to themselves', async function () {
        const { fundToken, owner } = await loadFixture(baseScenario)
        expect(await fundToken.read.totalSupply()).to.equal(0n)

        await fundToken.write.mint([owner.account.address, 1n])
        expect(await fundToken.read.totalSupply()).to.equal(1n)
        expect(await fundToken.read.balanceOf([owner.account.address])).to.equal(1n)
    })

    it('Right person minting to others', async function () {
        const { fundToken, alice } = await loadFixture(baseScenario)
        expect(await fundToken.read.totalSupply()).to.equal(0n)

        await fundToken.write.mint([alice.account.address, 1n])
        expect(await fundToken.read.totalSupply()).to.equal(1n)
        expect(await fundToken.read.balanceOf([alice.account.address])).to.equal(1n)
    })

    it('Wrong person minting', async function () {
        const { fundToken, owner, alice } = await loadFixture(baseScenario)
        expect(await fundToken.read.totalSupply()).to.equal(0n)

        await expect(
            fundToken.write.mint([owner.account.address, 1n], { account: alice.account })
        ).revertedWithCustomError(fundToken, 'OwnableUnauthorizedAccount')
        expect(await fundToken.read.totalSupply()).to.equal(0n)
    })
})
