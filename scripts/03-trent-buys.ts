import hre from 'hardhat'
import { getContract } from 'viem'
import { confirm, select } from '@inquirer/prompts'
import SystemModule from '../ignition/modules/System'
import { Deployment } from './cli'

import { abi as ERC721$ABI } from '../artifacts/@openzeppelin/contracts/token/ERC721/ERC721.sol/ERC721.json'
import { ERC721$Type } from '../artifacts/@openzeppelin/contracts/token/ERC721/ERC721.sol/ERC721'

export async function trentBuys(deployment?: Deployment) {
    const { nftExchange, nftInvestmentFund } = deployment ?? (await hre.ignition.deploy(SystemModule))

    const [trent] = await hre.viem.getWalletClients()

    let buyConfirm = true
    do {
        const numberOfListings = await nftExchange.read.numberOfListings()
        const listings = [] as { listingId: bigint; nftName: string; nftTokenId: bigint; price: bigint }[]
        for (let i = 0; i < numberOfListings; i++) {
            const [listingId, nftContractAddress, nftTokenId, , price, isSold] = await nftExchange.read.listings([
                BigInt(i)
            ])
            if (!isSold) {
                const nftContract = getContract({
                    abi: ERC721$ABI as ERC721$Type['abi'],
                    address: nftContractAddress,
                    client: trent
                })
                const nftName = await nftContract.read.name()
                listings.push({ listingId, nftName, nftTokenId, price })
            }
        }

        if (listings.length === 0) {
            break
        }

        buyConfirm = await confirm({
            message: `Does Trent want to buy NFTs?`,
            default: true
        })

        if (buyConfirm) {
            const listing = await select({
                message: 'Which one does he want to buy?',
                choices: listings.map((listing) => ({
                    name: `${listing.nftName} (#${listing.nftTokenId})`,
                    value: listing
                }))
            })

            await nftInvestmentFund.write.buyNFT([nftExchange.address, listing.listingId])
        }
    } while (buyConfirm)
}

if (require.main === module) {
    trentBuys().catch((e) => {
        console.error(e)
        process.exitCode = 1
    })
}
