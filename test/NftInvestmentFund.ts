import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { expect } from 'chai'
import hre from 'hardhat'
import { getAddress, parseEther } from 'viem'

describe('Investment fund', function () {
    async function baseScenario() {
        const publicClient = await hre.viem.getPublicClient()

        const [trent, alice, bob, oscar, mallory] = await hre.viem.getWalletClients()

        // Deploy one Unique and Funny NFT, and mint 3 from the latter
        const uniqueNft = await hre.viem.deployContract('UniqueNft', [], { client: { wallet: oscar } })
        const funnyNft = await hre.viem.deployContract('FunnyNft', [], { client: { wallet: oscar } })
        await funnyNft.write.safeMint([getAddress(oscar.account.address)], { account: oscar.account })
        await funnyNft.write.safeMint([getAddress(oscar.account.address)], { account: oscar.account })
        await funnyNft.write.safeMint([getAddress(oscar.account.address)], { account: oscar.account })

        expect(await uniqueNft.read.ownerOf([0n])).to.equal(getAddress(oscar.account.address))
        expect(await funnyNft.read.ownerOf([0n])).to.equal(getAddress(oscar.account.address))
        expect(await funnyNft.read.ownerOf([1n])).to.equal(getAddress(oscar.account.address))
        expect(await funnyNft.read.ownerOf([2n])).to.equal(getAddress(oscar.account.address))

        // Deploy NFT investment fund

        const oneWeekFromNow = new Date()
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)
        const twoWeeksFromNow = new Date()
        twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)

        const nftInvestmentFund = await hre.viem.deployContract('NftInvestmentFund', [
            'Investment Fund',
            'IFT',
            parseEther('100'),
            BigInt(Math.floor(oneWeekFromNow.getTime() / 1000)),
            BigInt(Math.floor(twoWeeksFromNow.getTime() / 1000))
        ])

        const fundToken = await hre.viem.getContractAt('FundToken', await nftInvestmentFund.read.fundToken())
        expect(await fundToken.read.name()).to.equal('Investment Fund Token')
        expect(await fundToken.read.symbol()).to.equal('IFT')
        expect(await fundToken.read.totalSupply()).to.equal(0n)

        // Alice buys 50, Bob buys 30, Malory buys 20 tokens
        const aliceFundTx = await nftInvestmentFund.write.invest([50n], {
            account: alice.account,
            value: parseEther('5000')
        })
        const bobFundTx = await nftInvestmentFund.write.invest([30n], {
            account: bob.account,
            value: parseEther('3000')
        })
        const malloryFundTx = await nftInvestmentFund.write.invest([20n], {
            account: mallory.account,
            value: parseEther('2000')
        })

        await expect(aliceFundTx).to.changeEtherBalances(
            [alice.account, nftInvestmentFund.address],
            [-parseEther('5000'), parseEther('5000')]
        )
        await expect(bobFundTx).to.changeEtherBalances(
            [bob.account, nftInvestmentFund.address],
            [-parseEther('3000'), parseEther('3000')]
        )
        await expect(malloryFundTx).to.changeEtherBalances(
            [mallory.account, nftInvestmentFund.address],
            [-parseEther('2000'), parseEther('2000')]
        )
        expect(await fundToken.read.balanceOf([getAddress(alice.account.address)])).to.equal(50n)
        expect(await fundToken.read.balanceOf([getAddress(bob.account.address)])).to.equal(30n)
        expect(await fundToken.read.balanceOf([getAddress(mallory.account.address)])).to.equal(20n)
        expect(await fundToken.read.totalSupply()).to.equal(100n)
        expect(await publicClient.getBalance({ address: nftInvestmentFund.address })).to.equal(parseEther('10000'))

        // Deploy NFT Exchange

        const nftExchange = await hre.viem.deployContract('NftExchange', [])

        // Oscar wants to sell his NFTs

        await uniqueNft.write.approve([nftExchange.address, 0n], { account: oscar.account })
        const { result: oscarSellsUniqueListingId, request: oscarSellsUniqueRequest } =
            await nftExchange.simulate.sellNFT([uniqueNft.address, 0n, parseEther('4000')], {
                account: getAddress(oscar.account.address)
            })
        await oscar.writeContract(oscarSellsUniqueRequest)

        await funnyNft.write.approve([nftExchange.address, 0n], { account: oscar.account })
        const { result: oscarSellsFunny0ListingId, request: oscarSellsFunny0Request } =
            await nftExchange.simulate.sellNFT([funnyNft.address, 0n, parseEther('1000')], {
                account: getAddress(oscar.account.address)
            })
        await oscar.writeContract(oscarSellsFunny0Request)

        await funnyNft.write.approve([nftExchange.address, 1n], { account: oscar.account })
        const { result: oscarSellsFunny1ListingId, request: oscarSellsFunny1Request } =
            await nftExchange.simulate.sellNFT([funnyNft.address, 1n, parseEther('1000')], {
                account: getAddress(oscar.account.address)
            })
        await oscar.writeContract(oscarSellsFunny1Request)

        await funnyNft.write.approve([nftExchange.address, 2n], { account: oscar.account })
        const { result: oscarSellsFunny2ListingId, request: oscarSellsFunny2Request } =
            await nftExchange.simulate.sellNFT([funnyNft.address, 2n, parseEther('1000')], {
                account: getAddress(oscar.account.address)
            })
        await oscar.writeContract(oscarSellsFunny2Request)

        // Time elapses, so Trent can buy the NFTs
        await time.increase(60 * 60 * 24 * 7)

        const trentBuysUniqueTx = await nftInvestmentFund.write.buyNFT([nftExchange.address, oscarSellsUniqueListingId])
        await expect(trentBuysUniqueTx).to.changeEtherBalances(
            [oscar.account, nftInvestmentFund.address],
            [parseEther('4000'), -parseEther('4000')]
        )
        const trentBuysFunny0Tx = await nftInvestmentFund.write.buyNFT([nftExchange.address, oscarSellsFunny0ListingId])
        await expect(trentBuysFunny0Tx).to.changeEtherBalances(
            [oscar.account, nftInvestmentFund.address],
            [parseEther('1000'), -parseEther('1000')]
        )
        const trentBuysFunny1Tx = await nftInvestmentFund.write.buyNFT([nftExchange.address, oscarSellsFunny1ListingId])
        await expect(trentBuysFunny1Tx).to.changeEtherBalances(
            [oscar.account, nftInvestmentFund.address],
            [parseEther('1000'), -parseEther('1000')]
        )
        const trentBuysFunny2Tx = await nftInvestmentFund.write.buyNFT([nftExchange.address, oscarSellsFunny2ListingId])
        await expect(trentBuysFunny2Tx).to.changeEtherBalances(
            [oscar.account, nftInvestmentFund.address],
            [parseEther('1000'), -parseEther('1000')]
        )

        expect(await publicClient.getBalance({ address: oscar.account.address })).to.be.greaterThanOrEqual(
            parseEther('16999') // Amounting for Gas
        )
        expect(await publicClient.getBalance({ address: nftInvestmentFund.address })).to.equal(parseEther('3000'))

        expect(await uniqueNft.read.ownerOf([0n])).to.equal(getAddress(nftInvestmentFund.address))
        expect(await funnyNft.read.ownerOf([0n])).to.equal(getAddress(nftInvestmentFund.address))
        expect(await funnyNft.read.ownerOf([1n])).to.equal(getAddress(nftInvestmentFund.address))
        expect(await funnyNft.read.ownerOf([2n])).to.equal(getAddress(nftInvestmentFund.address))

        expect(await nftInvestmentFund.read.ownedNftAddressesCount()).to.equal(2)
        expect(await nftInvestmentFund.read.ownedNftAddresses([0n])).to.equal(getAddress(uniqueNft.address))
        expect(await nftInvestmentFund.read.ownedNftAddresses([1n])).to.equal(getAddress(funnyNft.address))
        expect(await nftInvestmentFund.read.ownedNftTokenIds([uniqueNft.address, 0n])).to.equal(0n)
        expect(await nftInvestmentFund.read.ownedNftTokenIds([funnyNft.address, 0n])).to.equal(0n)
        expect(await nftInvestmentFund.read.ownedNftTokenIds([funnyNft.address, 1n])).to.equal(1n)
        expect(await nftInvestmentFund.read.ownedNftTokenIds([funnyNft.address, 2n])).to.equal(2n)

        // Trent sells Funny 1 to Oscar for twice as much
        await nftInvestmentFund.write.sellNFT([nftExchange.address, funnyNft.address, 1n, parseEther('2000')])
        expect(await nftInvestmentFund.read.activeListingsCount()).to.equal(1)

        expect(await nftInvestmentFund.read.ownedNftAddressesCount()).to.equal(2)
        expect(await nftInvestmentFund.read.ownedNftAddresses([0n])).to.equal(getAddress(uniqueNft.address))
        expect(await nftInvestmentFund.read.ownedNftAddresses([1n])).to.equal(getAddress(funnyNft.address))
        expect(await nftInvestmentFund.read.ownedNftTokenIds([uniqueNft.address, 0n])).to.equal(0n)
        expect(await nftInvestmentFund.read.ownedNftTokenIds([funnyNft.address, 0n])).to.equal(0n)
        expect(await nftInvestmentFund.read.ownedNftTokenIds([funnyNft.address, 1n])).to.equal(2n)

        const [, trentSellsFunny1ListingId] = await nftInvestmentFund.read.activeListings([0n])
        const oscarBuysFunny1Tx = await nftExchange.write.buyNFT([trentSellsFunny1ListingId], {
            account: oscar.account,
            value: parseEther('2000')
        })
        await expect(oscarBuysFunny1Tx).to.changeEtherBalances(
            [oscar.account, nftInvestmentFund.address],
            [-parseEther('2000'), parseEther('2000')]
        )
        await nftInvestmentFund.write.registerNFTSales()

        // Trent sells Unique to Oscar for twice as much
        await nftInvestmentFund.write.sellNFT([nftExchange.address, uniqueNft.address, 0n, parseEther('8000')])
        expect(await nftInvestmentFund.read.activeListingsCount()).to.equal(1)

        expect(await nftInvestmentFund.read.ownedNftAddressesCount()).to.equal(1)
        expect(await nftInvestmentFund.read.ownedNftAddresses([0n])).to.equal(getAddress(funnyNft.address))
        expect(await nftInvestmentFund.read.ownedNftTokenIds([funnyNft.address, 0n])).to.equal(0n)
        expect(await nftInvestmentFund.read.ownedNftTokenIds([funnyNft.address, 1n])).to.equal(2n)

        const [, trentSellsUniqueListingId] = await nftInvestmentFund.read.activeListings([0n])
        const oscarBuysUniqueTx = await nftExchange.write.buyNFT([trentSellsUniqueListingId], {
            account: oscar.account,
            value: parseEther('8000')
        })
        await expect(oscarBuysUniqueTx).to.changeEtherBalances(
            [oscar.account, nftInvestmentFund.address],
            [-parseEther('8000'), parseEther('8000')]
        )
        await nftInvestmentFund.write.registerNFTSales()

        // Time elapses, so Trent sells the remaining NFTs
        await time.increase(60 * 60 * 24 * 7)

        await nftInvestmentFund.write.sellNFT([nftExchange.address, funnyNft.address, 0n, parseEther('2000')])
        await nftInvestmentFund.write.sellNFT([nftExchange.address, funnyNft.address, 0n, parseEther('2000')])
        expect(await nftInvestmentFund.read.activeListingsCount()).to.equal(2)

        const [, trentSellsFunny0ListingId] = await nftInvestmentFund.read.activeListings([0n])
        const oscarBuysFunny0Tx = await nftExchange.write.buyNFT([trentSellsFunny0ListingId], {
            account: oscar.account,
            value: parseEther('2000')
        })
        await expect(oscarBuysFunny0Tx).to.changeEtherBalances(
            [oscar.account, nftInvestmentFund.address],
            [-parseEther('2000'), parseEther('2000')]
        )

        const [, trentSellsFunny2ListingId] = await nftInvestmentFund.read.activeListings([1n])
        const oscarBuysFunny2Tx = await nftExchange.write.buyNFT([trentSellsFunny2ListingId], {
            account: oscar.account,
            value: parseEther('2000')
        })
        await expect(oscarBuysFunny2Tx).to.changeEtherBalances(
            [oscar.account, nftInvestmentFund.address],
            [-parseEther('2000'), parseEther('2000')]
        )

        await nftInvestmentFund.write.registerNFTSales()

        expect(await nftInvestmentFund.read.ownedNftAddressesCount()).to.equal(0)

        // Check ownership and balances

        expect(await uniqueNft.read.ownerOf([0n])).to.equal(getAddress(oscar.account.address))
        expect(await funnyNft.read.ownerOf([0n])).to.equal(getAddress(oscar.account.address))
        expect(await funnyNft.read.ownerOf([1n])).to.equal(getAddress(oscar.account.address))
        expect(await funnyNft.read.ownerOf([2n])).to.equal(getAddress(oscar.account.address))

        expect(await publicClient.getBalance({ address: nftInvestmentFund.address })).to.equal(parseEther('17000'))
        expect(await publicClient.getBalance({ address: oscar.account.address })).to.be.greaterThanOrEqual(
            parseEther('2999') // Amounting for Gas
        )

        // Trent ends the investment

        await nftInvestmentFund.write.closeFund()
        expect(await nftInvestmentFund.read.ended()).to.equal(true)
        expect(await nftInvestmentFund.read.balanceAtEnd()).to.equal(parseEther('17000'))

        return { alice, bob, mallory, publicClient, fundToken, nftInvestmentFund }
    }

    it('Mallory plays nice', async function () {
        const { alice, bob, mallory, publicClient, fundToken, nftInvestmentFund } = await loadFixture(baseScenario)

        // Alice, Bob and Mallory withdraw peacefully

        await fundToken.write.approve(
            [nftInvestmentFund.address, await fundToken.read.balanceOf([alice.account.address])],
            { account: alice.account }
        )
        const aliceWithdrawsTx = await nftInvestmentFund.write.withdraw({ account: alice.account })
        await expect(aliceWithdrawsTx).to.changeEtherBalances(
            [alice.account, nftInvestmentFund.address],
            [parseEther((17000 * 0.5).toString()), -parseEther((17000 * 0.5).toString())]
        )
        expect(await publicClient.getBalance({ address: alice.account.address })).to.be.greaterThanOrEqual(
            parseEther((5000 + 17000 * 0.5 - 1).toString()) // Amounting for Gas
        )
        expect(await fundToken.read.balanceOf([alice.account.address])).to.equal(0n)

        await fundToken.write.approve(
            [nftInvestmentFund.address, await fundToken.read.balanceOf([bob.account.address])],
            { account: bob.account }
        )
        const bobWithdrawsTx = await nftInvestmentFund.write.withdraw({ account: bob.account })
        await expect(bobWithdrawsTx).to.changeEtherBalances(
            [bob.account, nftInvestmentFund.address],
            [parseEther((17000 * 0.3).toString()), -parseEther((17000 * 0.3).toString())]
        )
        expect(await publicClient.getBalance({ address: bob.account.address })).to.be.greaterThanOrEqual(
            parseEther((7000 + 17000 * 0.3 - 1).toString()) // Amounting for Gas
        )
        expect(await fundToken.read.balanceOf([bob.account.address])).to.equal(0n)

        await fundToken.write.approve(
            [nftInvestmentFund.address, await fundToken.read.balanceOf([mallory.account.address])],
            { account: mallory.account }
        )
        const malloryWithdrawsTx = await nftInvestmentFund.write.withdraw({ account: mallory.account })
        await expect(malloryWithdrawsTx).to.changeEtherBalances(
            [mallory.account, nftInvestmentFund.address],
            [parseEther((17000 * 0.2).toString()), -parseEther((17000 * 0.2).toString())]
        )
        expect(await publicClient.getBalance({ address: mallory.account.address })).to.be.greaterThanOrEqual(
            parseEther((8000 + 17000 * 0.2 - 1).toString()) // Amounting for Gas
        )
        expect(await fundToken.read.balanceOf([mallory.account.address])).to.equal(0n)

        expect(await publicClient.getBalance({ address: nftInvestmentFund.address })).to.equal(parseEther('0'))
        expect(await fundToken.read.totalSupply()).to.equal(0n)
    })

    it('Mallory is malicious', async function () {
        const { mallory, publicClient, fundToken, nftInvestmentFund } = await loadFixture(baseScenario)

        const attack = await hre.viem.deployContract('MallorysMaliciousMisappropriation', [nftInvestmentFund.address], {
            client: { wallet: mallory }
        })

        await fundToken.write.transfer([attack.address, await fundToken.read.balanceOf([mallory.account.address])], {
            account: mallory.account
        })
        expect(await fundToken.read.balanceOf([mallory.account.address])).to.equal(0n)
        expect(await fundToken.read.balanceOf([attack.address])).to.equal(20n)

        const attackTx = attack.write.attack({ account: mallory.account })
        await expect(attackTx).to.changeEtherBalances(
            [mallory.account, attack.address, nftInvestmentFund.address],
            [parseEther('0'), parseEther('17000'), -parseEther('17000')]
        )

        const withdrawTx = attack.write.withdraw({ account: mallory.account })
        await expect(withdrawTx).to.changeEtherBalances(
            [mallory.account, attack.address],
            [parseEther('17000'), -parseEther('17000')]
        )

        expect(await publicClient.getBalance({ address: nftInvestmentFund.address })).to.equal(parseEther('0'))
        expect(await publicClient.getBalance({ address: mallory.account.address })).to.be.greaterThanOrEqual(
            parseEther('24999') // Amounting for Gas
        )
        expect(await fundToken.read.totalSupply()).to.not.equal(0n)
    })
})
